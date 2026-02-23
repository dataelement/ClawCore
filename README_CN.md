<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> OpenClaw 的核心精简版 —— 一个有灵魂的 AI 助手。

[English](README.md) | [中文](README_CN.md)

ClawCore 从 [OpenClaw](https://github.com/openclaw/openclaw) 中提取了最核心的人格系统，打造成一个极简、自包含的个人 AI 助手。保留让 AI "活起来"的灵魂机制，去掉复杂的基础设施。

## 🎯 为什么做 ClawCore？

OpenClaw 很强大，但也很复杂。ClawCore 思考的是：**如果只保留灵魂，会怎样？**

### 与 OpenClaw 的核心区别

| ⚡ ClawCore | 🦞 OpenClaw |
|------------|------------|
| **索引式记忆** — 用 `MEMORY_INDEX.md` 做记忆目录，按需加载，无需向量数据库 | 混合向量搜索 + 嵌入模型 + 时间衰减 |
| **轻量心跳** — 简单的 `setInterval` 定时器 + 忙碌保护 | 完整的 cron 系统 + 子 Agent + 复杂调度 |
| **人机文件夹隔离** — 你的文件（`user/`）只读，AI 的工作区独立 | 共享工作区，访问范围更广 |
| **任务工作台** — 每个任务一个文件夹，完整的生命周期管理 | 无显式的任务文件夹概念 |
| **文件安全设计** — AI 永远不能修改你的原始文件，只能处理副本 | 文件系统访问范围更广 |
| **可在日用电脑上运行** — 无需专门购买一台电脑 | 偏向常驻服务器部署 |

### 🔒 在你自己的电脑上安全运行

大多数有文件访问权限的 AI 助手都会让人紧张 —— *万一它删了什么东西呢？* ClawCore 从架构层面解决了这个问题：

- **`user/` 文件夹是只读的。** AI 可以读取你的 PDF、Word、Excel，但物理上无法写入。
- **所有处理都在 `workbench/` 里进行。** 需要编辑文件？AI 会先复制到任务文件夹再操作。
- **每个操作都有权限边界。** 权限模型在工具层强制执行 —— 不靠信任，靠代码。

**这意味着你可以在日常使用的笔记本电脑上直接运行 ClawCore，完全不用担心。** 无需虚拟机、无需专用服务器、无需沙箱。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🧬 **灵魂系统** | AI 通过 `SOUL.md` 发展自己的个性 —— 不是聊天机器人，是一个角色 |
| 🪪 **身份觉醒** | 首次运行时的"觉醒"仪式，AI 在对话中发现自己是谁 |
| 🧠 **索引式记忆** | `MEMORY_INDEX.md` 目录索引，按需加载具体文件，无需向量数据库 |
| 🔧 **技能系统** | 可扩展的 `SKILL.md` 技能文件，渐进式暴露 |
| 📁 **用户保险箱** | 用户文件只读 —— AI 可以阅读但永远不能修改原文件 |
| 🛠️ **任务工作台** | 按任务创建独立文件夹，配有 `_TASK.md` 生命周期管理 |
| 💓 **心跳扫描** | 定时自主扫描 —— 发现值得处理的内容时自动创建带 🤖 前缀的任务 |

## 🚀 快速开始

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

首次运行时，ClawCore 会：

1. 让你配置大模型 API Key
2. 通过一段对话来"觉醒"AI 的身份
3. 在你的桌面创建工作区 `~/Desktop/ClawCore/`

## ⚙️ 配置

编辑 `~/Desktop/ClawCore/config.json`：

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

### 支持的模型服务

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
<summary><b>通义千问 (Qwen)</b></summary>

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
<summary><b>本地 Ollama</b></summary>

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

## 📂 工作区结构

ClawCore 在桌面上创建一个可见的工作区 —— 没有隐藏文件夹：

```
~/Desktop/ClawCore/
├── config.json             # 模型和心跳配置
├── state.json              # 运行状态（上次心跳时间等）
│
├── soul/                   # 🧬 AI 的人格
│   ├── SOUL.md             # 核心个性与价值观
│   ├── IDENTITY.md         # 名字、风格、emoji
│   └── BOOTSTRAP.md        # 首次运行脚本（完成后自动删除）
│
├── user/                   # 📁 你的文件（AI 只读）
│   ├── USER_PROFILE.md     # 你的档案
│   └── ...                 # PDF、Word、Excel 等
│
├── memory/                 # 🧠 AI 的记忆
│   ├── MEMORY_INDEX.md     # 记忆索引目录
│   ├── preferences.md      # 常青知识（偏好、习惯等）
│   └── 2026-02-23.md       # 日记型记忆
│
├── workbench/              # 🛠️ 任务工作台
│   ├── 2026-02-23_报告分析/
│   │   ├── _TASK.md        # 任务元数据与状态
│   │   └── output.md       # 产出文件
│   ├── 🤖_2026-02-23_资料整理/  # AI 自主发起的任务
│   └── _archive/           # 已归档的已完成任务
│
└── skills/                 # 🔧 技能定义
    └── my-skill/
        └── SKILL.md
```

### 权限模型

| 目录 | AI 的权限 | 用途 |
|------|----------|------|
| `soul/` | 读 + 写 | AI 管理自己的人格文件 |
| `user/` | **只读** | 你的文件 —— AI 需要处理时先复制到 workbench |
| `memory/` | 读 + 写 | AI 的持久记忆 |
| `workbench/` | 读 + 写 | 按任务划分的工作区 |
| `skills/` | 只读 | 技能定义文件 |

## 🔧 添加技能

在 `~/Desktop/ClawCore/skills/` 下创建文件夹，放入 `SKILL.md`：

```markdown
---
name: my-skill
description: "何时使用：用户问到 X 的时候。不适用于：Y。"
---

# 我的技能

给 AI 的详细使用说明...
```

AI 使用**渐进式暴露**机制 —— 系统提示中只展示技能名称和描述，AI 决定使用某个技能时才读取完整内容。

## 💓 心跳机制

ClawCore 包含一个受 OpenClaw 启发的轻量心跳机制：

- **默认间隔：** 60 分钟
- **做什么：** 扫描 `user/` 和 `workbench/` 文件夹的变化
- **智能调度：** 不会打断正在进行的对话 —— 忙碌时自动延后
- **自主任务：** AI 自主发起的任务文件夹带有 🤖 前缀，方便区分

## 📄 文档支持

ClawCore 可以读取 `user/` 文件夹中的多种文件格式：

| 格式 | 使用的库 |
|------|---------|
| PDF | `pdf-parse` |
| Word (.docx) | `mammoth` |
| Excel (.xlsx) | `xlsx` |
| Markdown、JSON、CSV、TXT | 原生支持 |

## 🏗️ 架构

```
CLI (index.ts)
  └── Agent (agent.ts)
        ├── 系统提示组装 ← 灵魂 + 身份 + 记忆索引 + 技能
        ├── LLM 提供者（OpenAI 兼容协议）
        ├── 工具执行器（15 个工具 + 权限控制）
        └── 心跳运行器（setInterval + 忙碌保护）
```

### 内置工具

| 工具 | 说明 |
|------|------|
| `read_file` | 读取文件（支持文档解析） |
| `write_file` | 写入文件（仅限 memory/ 和 workbench/） |
| `list_dir` | 列出目录内容 |
| `copy_to_workbench` | 从 user/ 复制文件到任务文件夹 |
| `create_task` | 创建新任务文件夹 |
| `update_task_status` | 更新任务状态 |
| `archive_task` | 归档任务 |
| `memory_read` / `memory_write` / `memory_index` | 记忆操作 |
| `read_skill` | 读取技能完整内容 |
| `update_soul` / `update_identity` | 修改人格文件 |
| `complete_bootstrap` | 完成首次觉醒 |
| `exec` | 执行 shell 命令 |

## 🤝 致谢

ClawCore 的灵感来自 [OpenClaw](https://github.com/openclaw/openclaw) 及其"让 AI 拥有真正个性"的愿景。我们提取了它的灵魂，让它回归核心。

## 📜 许可证

MIT
