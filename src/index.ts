#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import ora from "ora";
import { loadConfig, saveConfig, resolveWorkspaceDir } from "./config/config.js";
import { createOpenAIProvider } from "./llm/provider.js";
import { Agent } from "./agent/agent.js";
import { initWorkspace } from "./workspace/init.js";
import { CliInput } from "./cli/input.js";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../templates");

/** Simple terminal markdown renderer using chalk */
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, chalk.green.bold("   $1"))           // h3
    .replace(/^## (.+)$/gm, chalk.green.bold("  $1"))              // h2
    .replace(/^# (.+)$/gm, chalk.magenta.bold.underline("$1"))     // h1
    .replace(/\*\*(.+?)\*\*/g, chalk.bold("$1"))                   // bold
    .replace(/\*(.+?)\*/g, chalk.italic("$1"))                     // italic
    .replace(/`([^`]+)`/g, chalk.yellow("$1"))                     // inline code
    .replace(/^- /gm, chalk.dim("  • "))                           // list items
    .replace(/^(\d+)\. /gm, chalk.dim("  $1. "))                   // numbered list
    .replace(/^> (.+)$/gm, chalk.gray.italic("  │ $1"))            // blockquote
    .replace(/^---$/gm, chalk.dim("─".repeat(40)))                 // hr
    .replace(/^```\w*$/gm, chalk.dim("─".repeat(40)));             // code fence → hr
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceArg = args.find((a) => a.startsWith("--workspace="))?.split("=")[1];
  const workspaceDir = resolveWorkspaceDir(workspaceArg);

  console.log(chalk.cyan.bold("\n🦐 ClawCore") + chalk.dim(" — a core version of OpenClaw\n"));
  console.log(chalk.dim(`Workspace: ${workspaceDir}\n`));

  // Initialize workspace (creates directories + seeds templates if first run)
  await initWorkspace(workspaceDir, TEMPLATE_DIR);

  // Load config
  let config = await loadConfig(workspaceDir);

  // Check LLM config
  if (!config.llm.apiKey) {
    console.log(chalk.yellow("⚠️  No API key configured."));
    console.log(chalk.dim("  Set it via environment variable or config file:\n"));
    console.log(chalk.dim("  Option 1: export OPENAI_API_KEY=sk-..."));
    console.log(chalk.dim(`  Option 2: edit ${path.join(workspaceDir, "config.json")}\n`));

    // Try env var
    const envKey = process.env.OPENAI_API_KEY
      ?? process.env.CLAWCORE_API_KEY
      ?? process.env.LLM_API_KEY;

    if (envKey) {
      config = { ...config, llm: { ...config.llm, apiKey: envKey } };
      console.log(chalk.green("✓ API key found from environment variable.\n"));
    } else {
      // Interactive setup (use standard readline for this)
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const ask = (q: string) => new Promise<string>((r) => rl.question(q, r));

      const apiKey = await ask(chalk.cyan("Enter API key: "));
      if (!apiKey.trim()) {
        console.log(chalk.red("No API key provided. Exiting."));
        process.exit(1);
      }

      const baseUrl = await ask(
        chalk.cyan(`Base URL (default: ${config.llm.baseUrl}): `),
      );
      const model = await ask(
        chalk.cyan(`Model (default: ${config.llm.model}): `),
      );

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

  // Spinner for loading states
  const spinner = ora({ spinner: "dots", color: "cyan" });
  let streamingStarted = false;

  // Create agent with callbacks
  const agent = new Agent({
    llm,
    workspaceDir,
    callbacks: {
      onAssistantText: (text) => {
        // Called when streaming is complete — render markdown
        spinner.stop();
        if (text.trim() === "HEARTBEAT_OK") return;

        if (streamingStarted) {
          // We already streamed raw text, now re-render with markdown
          // Clear the streamed output and replace with rendered version
          process.stdout.write("\r\x1b[J"); // clear from cursor
          process.stdout.write("\n");
        }

        // Render markdown for pretty display
        const rendered = renderMarkdown(text);
        process.stdout.write(chalk.green("🦐 ") + rendered + "\n");
        streamingStarted = false;
      },
      onTextChunk: (chunk) => {
        // Streaming: show raw text as it arrives
        spinner.stop();
        if (!streamingStarted) {
          process.stdout.write(chalk.green("🦐 "));
          streamingStarted = true;
        }
        process.stdout.write(chunk);
      },
      onToolCall: (name, args) => {
        spinner.stop();
        console.log(
          chalk.dim(`  ⚙️  ${name}(${Object.entries(args).map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 60)}`).join(", ")})`),
        );
        spinner.start("Thinking...");
      },
      onToolResult: (name, result) => {
        spinner.stop();
        if (result.length > 200) {
          console.log(chalk.dim(`  ✓  ${name} → ${result.slice(0, 200)}...`));
        } else {
          console.log(chalk.dim(`  ✓  ${name} → ${result}`));
        }
        spinner.start("Thinking...");
      },
      onHeartbeatStart: () => {
        const ts = new Date().toLocaleString();
        spinner.stop();
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
  console.log(chalk.dim("  • 输入 exit 或 quit 或 Ctrl+C 退出"));
  console.log(chalk.dim("  • ⌥+Enter (Option+Enter) 换行，支持多行输入"));
  console.log(chalk.dim('  • 输入 """ 进入多行模式，再次输入 """ 发送'));
  console.log(chalk.dim("  • 拖拽文件到终端，自动复制到 user/ 文件夹"));
  console.log(chalk.dim("  • 在 skills/ 下添加 SKILL.md 可扩展 AI 的能力"));
  console.log(chalk.dim("\n" + "─".repeat(60)) + "\n");

  // Create custom input handler
  const input = new CliInput({
    prompt: chalk.cyan("You: "),
    userDir: path.join(workspaceDir, "user"),
  });

  input.on("message", async (text: string) => {
    streamingStarted = false;
    spinner.start("Thinking...");
    try {
      await agent.chat(text);
    } catch (err) {
      spinner.stop();
      streamingStarted = false;
      console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}\n`));
    }
    input.showInputPrompt();
  });

  input.on("file", (_filePath: string) => {
    // File was already copied by CliInput
  });

  input.on("exit", () => {
    spinner.stop();
    console.log(chalk.dim("\nGoodbye! 🦐\n"));
    agent.stop();
    process.exit(0);
  });

  // Keep the process alive — this interval prevents early exit
  // when stdin might momentarily have no active listeners
  const keepAlive = setInterval(() => { }, 1 << 30);
  process.on("exit", () => clearInterval(keepAlive));

  input.start();
}

main().catch((err) => {
  console.error(chalk.red(`Fatal: ${err.message}`));
  process.exit(1);
});
