#!/usr/bin/env node

import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { loadConfig, saveConfig, resolveWorkspaceDir } from "./config/config.js";
import { createOpenAIProvider } from "./llm/provider.js";
import { Agent } from "./agent/agent.js";
import { initWorkspace } from "./workspace/init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, "../templates");

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
      // Interactive setup
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

  // Create agent with callbacks
  const agent = new Agent({
    llm,
    workspaceDir,
    callbacks: {
      onAssistantText: (text) => {
        if (text.trim() === "HEARTBEAT_OK") return; // silent
        console.log(chalk.green("\n🦐 ") + text + "\n");
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
        console.log(chalk.dim("\n💓 Heartbeat scan...\n"));
      },
      onHeartbeatEnd: (result) => {
        console.log(chalk.dim(`💓 ${result}\n`));
      },
    },
  });

  // Initialize agent
  await agent.init(config.heartbeat.enabled ? config.heartbeat.intervalMinutes : undefined);

  console.log(chalk.dim(`Model: ${config.llm.model}`));
  console.log("");
  console.log(chalk.cyan("📖 Quick Guide:"));
  console.log(chalk.dim("  • 输入 exit 或 quit 退出对话"));
  console.log(chalk.dim("  • 把文件放入 user/ 文件夹，AI 可以帮你阅读和分析"));
  console.log(chalk.dim("  • 让 AI「记住」某件事，它会自动写入 memory/ 文件夹"));
  console.log(chalk.dim("  • AI 处理任务时会在 workbench/ 下创建任务文件夹"));
  console.log(chalk.dim("  • 在 skills/ 下添加 SKILL.md 可扩展 AI 的能力"));
  console.log(chalk.dim("\n" + "─".repeat(60)) + "\n");

  // Interactive chat loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan("You: "),
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
      console.log(chalk.dim("\nGoodbye! 🦐\n"));
      agent.stop();
      rl.close();
      process.exit(0);
    }

    try {
      await agent.chat(input);
    } catch (err) {
      console.error(chalk.red(`\nError: ${err instanceof Error ? err.message : String(err)}\n`));
    }

    rl.prompt();
  });

  rl.on("close", () => {
    agent.stop();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(chalk.red(`Fatal: ${err.message}`));
  process.exit(1);
});
