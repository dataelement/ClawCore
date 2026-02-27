#!/usr/bin/env node

import path from "node:path";
import readline from "node:readline";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { loadConfig, saveConfig, resolveWorkspaceDir } from "./config/config.js";
import { createOpenAIProvider } from "./llm/provider.js";
import { Agent } from "./agent/agent.js";
import { initWorkspace } from "./workspace/init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../templates");

/** Simple terminal markdown renderer */
function renderMarkdown(text: string): string {
  // Extract fenced code blocks first
  const codeBlocks: string[] = [];
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const label = lang ? chalk.dim(`  [${lang}]`) : "";
    const formatted = chalk.dim("─".repeat(40)) + label + "\n" +
      chalk.yellow(code.trimEnd()) + "\n" +
      chalk.dim("─".repeat(40));
    codeBlocks.push(formatted);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  processed = processed
    .replace(/^### (.+)$/gm, (_m, s) => chalk.green.bold(`   ${s}`))
    .replace(/^## (.+)$/gm, (_m, s) => chalk.green.bold(`  ${s}`))
    .replace(/^# (.+)$/gm, (_m, s) => chalk.magenta.bold.underline(s))
    .replace(/\*\*(.+?)\*\*/g, (_m, s) => chalk.bold(s))
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (_m, s) => chalk.italic(s))
    .replace(/`([^`]+)`/g, (_m, s) => chalk.yellow(s))
    .replace(/^- /gm, "  • ")
    .replace(/^(\d+)\. /gm, (_m, n) => `  ${n}. `)
    .replace(/^> (.+)$/gm, (_m, s) => chalk.gray.italic(`  │ ${s}`))
    .replace(/^---$/gm, chalk.dim("─".repeat(40)));

  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
  }
  return processed;
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceArg = args.find((a) => a.startsWith("--workspace="))?.split("=")[1];
  const workspaceDir = resolveWorkspaceDir(workspaceArg);

  // Debug: catch and log any unhandled errors that might silently kill the process
  process.on("unhandledRejection", (err) => {
    console.error(chalk.red("\n[unhandledRejection]"), err);
  });
  process.on("uncaughtException", (err) => {
    console.error(chalk.red("\n[uncaughtException]"), err);
  });

  console.log(chalk.cyan.bold("\n🦐 ClawCore") + chalk.dim(" — a core version of OpenClaw\n"));
  console.log(chalk.dim(`Workspace: ${workspaceDir}\n`));

  // Initialize workspace
  await initWorkspace(workspaceDir, TEMPLATE_DIR);

  // Load config
  let config = await loadConfig(workspaceDir);

  // Check LLM config
  if (!config.llm.apiKey) {
    console.log(chalk.yellow("⚠️  No API key configured."));
    console.log(chalk.dim("  Set it via environment variable or config file:\n"));
    console.log(chalk.dim("  Option 1: export OPENAI_API_KEY=sk-..."));
    console.log(chalk.dim(`  Option 2: edit ${path.join(workspaceDir, "config.json")}\n`));

    const envKey = process.env.OPENAI_API_KEY
      ?? process.env.CLAWCORE_API_KEY
      ?? process.env.LLM_API_KEY;

    if (envKey) {
      config = { ...config, llm: { ...config.llm, apiKey: envKey } };
      console.log(chalk.green("✓ API key found from environment variable.\n"));
    } else {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string) => new Promise<string>((r) => rl.question(q, r));

      const apiKey = await ask(chalk.cyan("Enter API key: "));
      if (!apiKey.trim()) {
        console.log(chalk.red("No API key provided. Exiting."));
        process.exit(1);
      }

      const baseUrl = await ask(chalk.cyan(`Base URL (default: ${config.llm.baseUrl}): `));
      const model = await ask(chalk.cyan(`Model (default: ${config.llm.model}): `));

      config = {
        ...config,
        llm: {
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim() || config.llm.baseUrl,
          model: model.trim() || config.llm.model,
        },
      };

      await saveConfig(config);
      console.log(chalk.green("\n✓ Config saved.\n"));
      rl.close();
    }
  }

  // Create LLM provider
  const llm = createOpenAIProvider(config.llm);

  // Create agent
  const agent = new Agent({
    llm,
    workspaceDir,
    callbacks: {
      onAssistantText: (text) => {
        if (text.trim() === "HEARTBEAT_OK") return;
        // Render complete response with markdown formatting
        const rendered = renderMarkdown(text);
        console.log(chalk.green("\n🦐 ") + rendered);
      },
      onTextChunk: () => {
        // Streaming runs under the hood but we wait for the complete text
        // to render markdown properly
      },
      onToolCall: (name, args) => {
        console.log(
          chalk.dim(`  ⚙️  ${name}(${Object.entries(args).map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 60)}`).join(", ")})`),
        );
      },
      onToolResult: (name, result) => {
        if (result.length > 200) {
          console.log(chalk.dim(`  ✓  ${name} → ${result.slice(0, 200)}...`));
        } else {
          console.log(chalk.dim(`  ✓  ${name} → ${result}`));
        }
      },
      onHeartbeatStart: () => {
        const ts = new Date().toLocaleString();
        console.log(chalk.dim(`\n💓 Heartbeat scan [${ts}]...\n`));
      },
      onHeartbeatEnd: (result) => {
        const ts = new Date().toLocaleString();
        console.log(chalk.dim(`💓 [${ts}] ${result}\n`));
      },
    },
  });

  // Initialize agent
  await agent.init(config.heartbeat.enabled ? config.heartbeat.intervalMinutes : undefined);

  console.log(chalk.dim(`Model: ${config.llm.model}`));
  console.log("");
  console.log(chalk.cyan("📖 Quick Guide:"));
  console.log(chalk.dim("  • 输入 exit 或 quit 退出对话"));
  console.log(chalk.dim('  • 输入 """ 进入多行模式，再次输入 """ 发送'));
  console.log(chalk.dim("  • 拖拽文件到终端，自动复制到 user/ 文件夹"));
  console.log(chalk.dim("  • 在 skills/ 下添加 SKILL.md 可扩展 AI 的能力"));
  console.log(chalk.dim("\n" + "─".repeat(60)) + "\n");

  // Interactive chat loop — simple readline, proven to work
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan("You: "),
  });

  // Multiline state
  let multilineMode = false;
  let multilineBuffer: string[] = [];
  const userDir = path.join(workspaceDir, "user");

  rl.prompt();

  rl.on("line", async (line) => {
    // --- Multiline mode ---
    if (multilineMode) {
      if (line.trim() === '"""') {
        multilineMode = false;
        const text = multilineBuffer.join("\n").trim();
        multilineBuffer = [];
        if (text) {
          await handleMessage(text);
        }
        rl.prompt();
      } else {
        multilineBuffer.push(line);
        process.stdout.write(chalk.dim("... "));
      }
      return;
    }

    // --- Start multiline ---
    if (line.trim() === '"""') {
      multilineMode = true;
      multilineBuffer = [];
      console.log(chalk.dim('📝 Multiline mode — type """ on a new line to send'));
      process.stdout.write(chalk.dim("... "));
      return;
    }

    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Exit
    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      console.log(chalk.dim("\nGoodbye! 🦐\n"));
      agent.stop();
      rl.close();
      process.exit(0);
    }

    // File drag-and-drop detection
    // macOS Terminal pastes paths like: /path/to/file, '/path/to/file', /path/to/my\ file
    const cleanPath = input
      .replace(/^['"]|['"]$/g, "")   // strip surrounding quotes
      .replace(/\\ /g, " ")           // unescape spaces
      .trim();
    if (cleanPath.startsWith("/") || cleanPath.startsWith("~")) {
      const resolved = cleanPath.replace(/^~/, process.env.HOME ?? "");
      try {
        const stat = await fs.stat(resolved);
        if (stat.isFile()) {
          const fileName = path.basename(resolved);
          const dest = path.join(userDir, fileName);
          await fs.copyFile(resolved, dest);
          const sizeKb = (stat.size / 1024).toFixed(1);
          console.log(chalk.green(`✓ Copied to user/${fileName} (${sizeKb} KB)`));
          rl.prompt();
          return;
        }
      } catch {
        // Not a valid path, treat as message
      }
    }

    await handleMessage(input);
    rl.prompt();
  });

  rl.on("close", () => {
    agent.stop();
    process.exit(0);
  });

  async function handleMessage(text: string): Promise<void> {
    console.log(chalk.dim("⏳ Thinking..."));
    try {
      await agent.chat(text);
    } catch (err) {
      console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}\n`));
    }
  }
}

main().catch((err) => {
  console.error(chalk.red(`Fatal: ${err.message}`));
  process.exit(1);
});
