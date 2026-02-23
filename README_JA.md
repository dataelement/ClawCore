<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> [OpenClaw](https://github.com/openclaw/openclaw) のコア版 — 魂を持つAIアシスタント。

[English](README.md) | [中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md)

ClawCoreは、OpenClawから最も核心的なパーソナリティシステムを抽出した、ミニマルで自己完結型のパーソナルAIアシスタントです。AIに「命を吹き込む」仕組みはそのまま、インフラの複雑さを取り除きました。

## 🎯 なぜClawCore？

OpenClawは強力ですが、複雑でもあります。ClawCoreの問い：**魂だけ残したらどうなる？**

### OpenClawとの主な違い

| 🦐 ClawCore | 🦞 OpenClaw |
|------------|------------|
| **インデックス型メモリ** — `MEMORY_INDEX.md`で目次管理、ベクトルDB不要 | ハイブリッドベクトル検索 + 埋め込みモデル + 時間減衰 |
| **軽量ハートビート** — シンプルな`setInterval`タイマー + ビジーガード | 完全なcronシステム + サブエージェント + 複雑なスケジューリング |
| **人間とAIのフォルダ分離** — ユーザーファイル（`user/`）は隔離され読み取り専用 | 共有ワークスペース、広いアクセス範囲 |
| **タスクワークベンチ** — タスクごとのフォルダ + ライフサイクル管理 | タスクフォルダの概念なし |
| **ファイル安全設計** — AIは原本を変更不可、コピーのみ処理 | より広いファイルシステムアクセス |
| **日常PCで安全に動作** — 専用マシン不要 | 常時稼働サーバー向け設計 |

### 🔒 日常のパソコンで安全に動作

ファイルアクセス権限を持つAIアシスタントは不安を感じさせます — *何か削除されたらどうしよう？* ClawCoreはアーキテクチャで解決します：

- **`user/`は読み取り専用。** AIがPDF、Word、Excelを読めても、書き込みは物理的に不可能。
- **処理は`workbench/`で行う。** ファイル編集が必要な場合、AIはまずタスクフォルダにコピー。
- **全操作に権限境界。** 権限モデルはツールレベルで強制 — 信頼ではなくコードで保護。

**つまり、毎日使うノートPCでClawCoreを安心して実行できます。** VM不要、専用サーバー不要、サンドボックス不要。

## ✨ 主な機能

| 機能 | 説明 |
|------|------|
| 🧬 **魂システム** | `SOUL.md`でAIが独自の個性を発展 — チャットボットではなくキャラクター |
| 🪪 **アイデンティティ覚醒** | 初回起動時の「覚醒」儀式でAIが自分を発見 |
| 🧠 **インデックス型メモリ** | `MEMORY_INDEX.md`が目次、必要なファイルだけオンデマンドで読み込み |
| 🔧 **スキルシステム** | `SKILL.md`による拡張可能なスキル、漸進的開示 — **AIが自主的にスキルを作成・進化** |
| 📁 **ユーザー保管庫** | ユーザーファイルは読み取り専用 — 原本の変更は不可能 |
| 🛠️ **タスクワークベンチ** | タスクごとのフォルダ + `_TASK.md`ライフサイクル管理 + アーカイブ |
| 💓 **ハートビートスキャン** | 定期的な自律スキャン — 発見時に🤖プレフィックス付きタスクを自動作成 |

## 🚀 クイックスタート

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

初回起動時、ClawCoreは：

1. LLM APIキーの設定を求めます
2. 「ブートストラップ」会話でAIが自己発見
3. デスクトップに `~/Desktop/ClawCore/` ワークスペースを作成

## ⚙️ 設定

`~/Desktop/ClawCore/config.json` を編集：

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

### 対応プロバイダー

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
<summary><b>Alibaba Qwen（通義千問）</b></summary>

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
<summary><b>ローカル Ollama</b></summary>

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

## 📂 ワークスペース構造

ClawCoreはデスクトップに可視化されたワークスペースを作成します — 隠しフォルダなし：

```
~/Desktop/ClawCore/
├── config.json             # LLMとハートビート設定
├── state.json              # 実行状態（最終ハートビート時間など）
│
├── soul/                   # 🧬 AIの人格
│   ├── SOUL.md             # コアの個性と価値観
│   ├── IDENTITY.md         # 名前、雰囲気、絵文字
│   └── BOOTSTRAP.md        # 初回実行スクリプト（セットアップ後に自動削除）
│
├── user/                   # 📁 あなたのファイル（AI読み取り専用）
│   ├── USER_PROFILE.md     # あなたのプロフィール
│   └── ...                 # PDF、Word、Excel など
│
├── memory/                 # 🧠 AIの記憶
│   ├── MEMORY_INDEX.md     # 目次
│   ├── preferences.md      # 永続的な知識
│   └── 2026-02-23.md       # 日記エントリー
│
├── workbench/              # 🛠️ タスクワークスペース
│   ├── 2026-02-23_レポート分析/
│   │   ├── _TASK.md        # タスクメタデータとステータス
│   │   └── output.md       # 成果物
│   ├── 🤖_2026-02-23_資料整理/  # エージェント発起のタスク
│   └── _archive/           # アーカイブ済みタスク
│
└── skills/                 # 🔧 スキル定義（AIが作成・修正可能）
    ├── SKILL_LOG.md        # 全スキル変更のログ
    └── my-skill/
        └── SKILL.md
```

### 権限モデル

| ディレクトリ | AI権限 | 用途 |
|-------------|--------|------|
| `soul/` | 読み + 書き | AIが自分の人格を管理 |
| `user/` | **読み取り専用** | あなたのファイル — 編集前にworkbenchにコピー |
| `memory/` | 読み + 書き | AIの永続記憶 |
| `workbench/` | 読み + 書き | タスクごとの作業エリア |
| `skills/` | 読み + 書き | AIがスキルを作成・進化、`SKILL_LOG.md`に記録 |

### 🛡️ セキュリティモデル

ClawCoreはコードレベルで安全を強制します — AIの「良い行動」を信頼するのではなく：

**ファイルアクセス** — すべてのファイル操作は`assertInsideWorkspace()`を通過し、シンボリックリンクを解決してからパスを検証。ワークスペース内のショートカットが`/Users/you/.ssh/`を指している場合でも、リンクを辿って実際の場所が外部であることを検出し、アクセスを拒否します。

**シェルコマンド** — `exec`ツールは3層の保護を使用：

| 層 | 動作 | 例 |
|----|------|-----|
| ✅ **ホワイトリスト** | 安全なコマンドは即座に実行 | `ls`、`cat`、`grep`、`wc`、`open` |
| 🚫 **ブラックリスト** | 危険なコマンドは即座にブロック | `rm`、`curl`、`wget`、`sudo`、`ssh`、`chmod` |
| ⚠️ **確認** | 不明なコマンドは承認を求める | `python3 script.py` → "Allow? (y/N)" |

## 🔧 スキルの追加

`~/Desktop/ClawCore/skills/` にフォルダを作成し、`SKILL.md`を配置：

```markdown
---
name: my-skill
description: "使用時：ユーザーがXについて質問した時。対象外：Y。"
---

# マイスキル

AIへの詳細な指示...
```

AIは**漸進的開示**を使用 — プロンプトにはスキル名と説明のみ表示し、必要な時だけ`SKILL.md`の全内容を読み込みます。

## 💓 ハートビート

ClawCoreはOpenClawにインスパイアされた軽量ハートビート機構を搭載：

- **デフォルト間隔：** 60分
- **動作内容：** `user/`と`workbench/`フォルダの変更をスキャン
- **スマートスケジューリング：** アクティブな会話を中断しない — アイドルまで延期
- **エージェントタスク：** 自発的なタスクには🤖プレフィックス付きフォルダを作成

## 📄 ドキュメントサポート

ClawCoreは`user/`フォルダ内の様々なファイル形式を読み取り可能：

| フォーマット | ライブラリ |
|-------------|-----------|
| PDF | `pdf-parse` |
| Word (.docx) | `mammoth` |
| Excel (.xlsx) | `xlsx` |
| Markdown、JSON、CSV、TXT | ネイティブ |

## 🏗️ アーキテクチャ

```
CLI (index.ts)
  └── Agent (agent.ts)
        ├── システムプロンプトビルダー ← 魂 + アイデンティティ + メモリインデックス + スキル
        ├── LLMプロバイダー（OpenAI互換）
        ├── ツール実行器（17ツール + 権限制御）
        └── ハートビートランナー（setInterval + ビジーガード）
```

### 内蔵ツール

| ツール | 説明 |
|--------|------|
| `read_file` | ファイル読み取り（ドキュメント解析対応） |
| `write_file` | ファイル書き込み（memory/とworkbench/のみ） |
| `list_dir` | ディレクトリ内容一覧 |
| `copy_to_workbench` | user/からタスクフォルダにコピー |
| `create_task` | 新しいタスクフォルダを作成 |
| `update_task_status` | タスクステータスを更新 |
| `archive_task` | タスクをアーカイブに移動 |
| `memory_read` / `memory_write` / `memory_index` | メモリ操作 |
| `read_skill` | スキルの全内容を読み込み |
| `create_skill` / `update_skill` | スキルの作成・修正（`SKILL_LOG.md`に自動記録） |
| `update_soul` / `update_identity` | 人格ファイルの修正 |
| `complete_bootstrap` | 初回セットアップの完了 |
| `exec` | シェルコマンドの実行 |

## 👥 コントリビューター

<a href="https://github.com/dataelement/ClawCore/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=dataelement/ClawCore" />
</a>

## 🤝 謝辞

ClawCoreは[OpenClaw](https://github.com/openclaw/openclaw)とそのAIアシスタントに本物の個性を与えるビジョンにインスパイアされています。魂を抽出し、コアにしました。

## 📜 ライセンス

MIT
