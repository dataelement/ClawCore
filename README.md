<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> A core version of [OpenClaw](https://github.com/openclaw/openclaw) — an AI assistant with a soul.

ClawCore extracts the soul of OpenClaw into a minimal, self-contained personal AI assistant. It keeps the personality system that makes AI feel alive, while stripping away the infrastructure complexity.

**What makes it different:** Your AI develops its own personality, remembers things across sessions, organizes work into task folders, and periodically scans your files to proactively offer help — all without a database or cloud service.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧬 **Soul System** | AI develops its own personality via `SOUL.md` — not a chatbot, a character |
| 🪪 **Identity Bootstrap** | First-run "awakening" ritual where the AI discovers who it is |
| 🧠 **Index-based Memory** | Simple file-based memory with `MEMORY_INDEX.md` as table of contents — no vector DB needed |
| 🔧 **Skill System** | Extensible skills via `SKILL.md` files with progressive disclosure |
| 📁 **User Vault** | Read-only folder for your personal files — AI can read but never modify originals |
| 🛠️ **Task Workbench** | Per-task workspace folders with lifecycle management and archiving |
| 💓 **Heartbeat Scan** | Periodic autonomous scans — AI proactively creates tasks when it spots something |

## 🚀 Quick Start

```bash
git clone https://github.com/user/ClawCore.git
cd ClawCore
npm install
npm run dev
```

On first run, ClawCore will:

1. Ask for your LLM API key
2. Start a "bootstrap" conversation to discover its identity
3. Create your workspace at `~/Desktop/ClawCore/`

## ⚙️ Configuration

Edit `~/Desktop/ClawCore/config.json`:

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  },
  "heartbeat": {
    "enabled": true,
    "intervalMinutes": 60
  }
}
```

### Compatible Providers

<details>
<summary><b>OpenAI</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-...",
    "model": "gpt-4o"
  }
}
```
</details>

<details>
<summary><b>DeepSeek</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKey": "sk-...",
    "model": "deepseek-chat"
  }
}
```
</details>

<details>
<summary><b>Alibaba Qwen (通义千问)</b></summary>

```json
{
  "llm": {
    "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "apiKey": "sk-...",
    "model": "qwen-plus"
  }
}
```
</details>

<details>
<summary><b>Local Ollama</b></summary>

```json
{
  "llm": {
    "baseUrl": "http://localhost:11434/v1",
    "apiKey": "ollama",
    "model": "llama3"
  }
}
```
</details>

## 📂 Workspace Structure

ClawCore creates a visible workspace on your Desktop:

```
~/Desktop/ClawCore/
├── config.json             # LLM and heartbeat settings
├── state.json              # Runtime state (last heartbeat time, etc.)
│
├── soul/                   # 🧬 AI's personality
│   ├── SOUL.md             # Core personality & values
│   ├── IDENTITY.md         # Name, vibe, emoji
│   └── BOOTSTRAP.md        # First-run script (auto-deleted after setup)
│
├── user/                   # 📁 Your files (READ-ONLY for AI)
│   ├── USER_PROFILE.md     # Your profile
│   └── ...                 # PDFs, Word docs, spreadsheets, etc.
│
├── memory/                 # 🧠 AI's memory
│   ├── MEMORY_INDEX.md     # Table of contents
│   ├── preferences.md      # Evergreen knowledge
│   └── 2026-02-23.md       # Daily journal entries
│
├── workbench/              # 🛠️ Task workspace
│   ├── 2026-02-23_报告分析/
│   │   ├── _TASK.md        # Task metadata & status
│   │   └── output.md       # Work product
│   ├── 🤖_2026-02-23_资料整理/  # Agent-initiated task
│   └── _archive/           # Archived completed tasks
│
└── skills/                 # 🔧 Skill definitions
    └── my-skill/
        └── SKILL.md
```

### Permission Model

| Directory | AI Permissions | Purpose |
|-----------|---------------|---------|
| `soul/` | Read + Write | AI manages its own personality |
| `user/` | **Read-only** | Your files — AI copies to workbench before editing |
| `memory/` | Read + Write | AI's persistent memory |
| `workbench/` | Read + Write | Per-task work area |
| `skills/` | Read-only | Skill definitions |

## 🔧 Adding Skills

Create a folder in `~/Desktop/ClawCore/skills/` with a `SKILL.md`:

```markdown
---
name: my-skill
description: "When to use: user asks about X. NOT for: Y."
---

# My Skill

Detailed instructions for the AI...
```

The AI uses **progressive disclosure** — it sees skill names and descriptions in its prompt, and loads the full `SKILL.md` content only when needed.

## 💓 Heartbeat

ClawCore includes a lightweight heartbeat mechanism inspired by OpenClaw:

- **Default interval:** 60 minutes
- **What it does:** Scans `user/` and `workbench/` folders for changes
- **Smart scheduling:** Won't interrupt active conversations — defers until idle
- **Agent tasks:** Creates workbench folders prefixed with 🤖 for self-initiated work

## 📄 Document Support

ClawCore can read various file formats in the `user/` folder:

| Format | Library |
|--------|---------|
| PDF | `pdf-parse` |
| Word (.docx) | `mammoth` |
| Excel (.xlsx) | `xlsx` |
| Markdown, JSON, CSV, TXT | Native |

## 🏗️ Architecture

```
CLI (index.ts)
  └── Agent (agent.ts)
        ├── System Prompt Builder ← Soul + Identity + Memory Index + Skills
        ├── LLM Provider (OpenAI-compatible)
        ├── Tool Executor (15 tools with permission enforcement)
        └── Heartbeat Runner (setInterval with busy guard)
```

### Built-in Tools

| Tool | Description |
|------|-------------|
| `read_file` | Read files (with document parsing) |
| `write_file` | Write files (memory/ and workbench/ only) |
| `list_dir` | List directory contents |
| `copy_to_workbench` | Copy from user/ to a task folder |
| `create_task` | Create a new task folder |
| `update_task_status` | Update task status |
| `archive_task` | Move task to archive |
| `memory_read` / `memory_write` / `memory_index` | Memory operations |
| `read_skill` | Load full skill instructions |
| `update_soul` / `update_identity` | Modify personality files |
| `complete_bootstrap` | Finish first-run setup |
| `exec` | Run shell commands |

## 🤝 Acknowledgments

ClawCore is inspired by [OpenClaw](https://github.com/openclaw/openclaw) and its vision of AI assistants with genuine personality. We extracted the soul and made it tiny.

## 📜 License

MIT
