<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> [OpenClaw](https://github.com/openclaw/openclaw)의 코어 버전 — 영혼을 가진 AI 어시스턴트.

[English](README.md) | [中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md)

ClawCore는 OpenClaw에서 가장 핵심적인 퍼스널리티 시스템을 추출하여 만든, 미니멀하고 자체 완결형 개인 AI 어시스턴트입니다. AI를 살아있게 만드는 소울 메커니즘은 유지하면서 인프라 복잡성은 제거했습니다.

## 🎯 왜 ClawCore인가?

OpenClaw는 강력하지만, 동시에 복잡합니다. ClawCore의 질문: **영혼만 남기면 어떻게 될까?**

### OpenClaw와의 주요 차이점

| 🦐 ClawCore | 🦞 OpenClaw |
|------------|------------|
| **인덱스 기반 메모리** — `MEMORY_INDEX.md`로 목차 관리, 벡터 DB 불필요 | 하이브리드 벡터 검색 + 임베딩 모델 + 시간 감쇠 |
| **경량 하트비트** — 간단한 `setInterval` 타이머 + 비지 가드 | 완전한 cron 시스템 + 서브 에이전트 + 복잡한 스케줄링 |
| **인간-AI 폴더 분리** — 사용자 파일(`user/`)은 격리되어 읽기 전용 | 공유 워크스페이스, 넓은 접근 범위 |
| **태스크 워크벤치** — 태스크별 폴더 + 라이프사이클 관리 | 태스크 폴더 개념 없음 |
| **파일 안전 설계** — AI가 원본 수정 불가, 복사본만 처리 | 더 넓은 파일 시스템 접근 |
| **일상 PC에서 안전 실행** — 전용 머신 불필요 | 상시 가동 서버 배포 지향 |

### 🔒 일상 컴퓨터에서 안전하게 실행

파일 접근 권한이 있는 AI 어시스턴트는 불안하게 만듭니다 — *뭔가 삭제되면 어떡하지?* ClawCore는 아키텍처로 해결합니다:

- **`user/`는 읽기 전용.** AI가 PDF, Word, Excel을 읽을 수 있지만, 쓰기는 물리적으로 불가능.
- **처리는 `workbench/`에서.** 파일 편집이 필요하면 AI가 먼저 태스크 폴더로 복사.
- **모든 작업에 권한 경계.** 권한 모델은 도구 레벨에서 강제 — 신뢰가 아니라 코드로 보호.

**즉, 매일 사용하는 노트북에서 ClawCore를 걱정 없이 실행할 수 있습니다.** VM 불필요, 전용 서버 불필요, 샌드박스 불필요.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🧬 **소울 시스템** | `SOUL.md`로 AI가 고유한 개성 발전 — 챗봇이 아닌 캐릭터 |
| 🪪 **아이덴티티 각성** | 첫 실행 시 "각성" 의식으로 AI가 자신을 발견 |
| 🧠 **인덱스 기반 메모리** | `MEMORY_INDEX.md`가 목차, 필요한 파일만 온디맨드 로딩 |
| 🔧 **스킬 시스템** | `SKILL.md` 기반 확장 가능한 스킬, 점진적 노출 — **AI가 자주적으로 스킬 생성·진화** |
| 📁 **사용자 보관함** | 사용자 파일 읽기 전용 — 원본 수정 불가 |
| 🛠️ **태스크 워크벤치** | 태스크별 폴더 + `_TASK.md` 라이프사이클 관리 + 아카이브 |
| 💓 **하트비트 스캔** | 정기 자율 스캔 — 발견 시 🤖 접두사 태스크 자동 생성 |

## 🚀 빠른 시작

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

첫 실행 시, ClawCore는:

1. LLM API 키 설정을 요청
2. "부트스트랩" 대화로 AI가 자기 발견
3. 데스크톱에 `~/Desktop/ClawCore/` 워크스페이스 생성

## ⚙️ 설정

`~/Desktop/ClawCore/config.json` 편집:

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

### 지원 프로바이더

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
<summary><b>Alibaba Qwen (통의천문)</b></summary>

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
<summary><b>로컬 Ollama</b></summary>

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

## 📂 워크스페이스 구조

ClawCore는 데스크톱에 보이는 워크스페이스를 생성합니다 — 숨김 폴더 없음:

```
~/Desktop/ClawCore/
├── config.json             # LLM 및 하트비트 설정
├── state.json              # 런타임 상태 (마지막 하트비트 시간 등)
│
├── soul/                   # 🧬 AI의 인격
│   ├── SOUL.md             # 핵심 개성과 가치관
│   ├── IDENTITY.md         # 이름, 분위기, 이모지
│   └── BOOTSTRAP.md        # 첫 실행 스크립트 (설정 후 자동 삭제)
│
├── user/                   # 📁 당신의 파일 (AI 읽기 전용)
│   ├── USER_PROFILE.md     # 당신의 프로필
│   └── ...                 # PDF, Word, Excel 등
│
├── memory/                 # 🧠 AI의 기억
│   ├── MEMORY_INDEX.md     # 목차
│   ├── preferences.md      # 영구적 지식
│   └── 2026-02-23.md       # 일기 항목
│
├── workbench/              # 🛠️ 태스크 워크스페이스
│   ├── 2026-02-23_보고서분석/
│   │   ├── _TASK.md        # 태스크 메타데이터 및 상태
│   │   └── output.md       # 산출물
│   ├── 🤖_2026-02-23_자료정리/  # 에이전트 발의 태스크
│   └── _archive/           # 아카이브된 완료 태스크
│
└── skills/                 # 🔧 스킬 정의 (AI가 생성·수정 가능)
    ├── SKILL_LOG.md        # 모든 스킬 변경 로그
    └── my-skill/
        └── SKILL.md
```

### 권한 모델

| 디렉토리 | AI 권한 | 용도 |
|----------|---------|------|
| `soul/` | 읽기 + 쓰기 | AI가 자신의 인격 관리 |
| `user/` | **읽기 전용** | 당신의 파일 — 편집 전 workbench로 복사 |
| `memory/` | 읽기 + 쓰기 | AI의 영구 기억 |
| `workbench/` | 읽기 + 쓰기 | 태스크별 작업 영역 |
| `skills/` | 읽기 + 쓰기 | AI가 스킬 생성·진화, `SKILL_LOG.md`에 기록 |

### 🛡️ 보안 모델

ClawCore는 AI의 "착한 행동"을 신뢰하는 대신 코드 레벨에서 안전을 강제합니다:

**파일 접근** — 모든 파일 작업은 `assertInsideWorkspace()`를 거치며, 심볼릭 링크를 해결한 후 경로를 확인합니다. 워크스페이스 내 바로가기가 `/Users/you/.ssh/`를 가리키더라도 링크를 추적해 실제 위치가 외부임을 감지하고 접근을 거부합니다.

**셸 명령** — `exec` 도구는 3단계 보호를 사용:

| 단계 | 동작 | 예시 |
|------|------|------|
| ✅ **화이트리스트** | 안전한 명령은 즉시 실행 | `ls`, `cat`, `grep`, `wc`, `open` |
| 🚫 **블랙리스트** | 위험한 명령은 즉시 차단 | `rm`, `curl`, `wget`, `sudo`, `ssh`, `chmod` |
| ⚠️ **확인** | 알 수 없는 명령은 승인 요청 | `python3 script.py` → "Allow? (y/N)" |

## 🔧 스킬 추가

`~/Desktop/ClawCore/skills/`에 폴더를 만들고 `SKILL.md`를 배치:

```markdown
---
name: my-skill
description: "사용 시: 사용자가 X에 대해 질문할 때. 해당 아님: Y."
---

# 나의 스킬

AI에 대한 자세한 지침...
```

AI는 **점진적 노출**을 사용 — 프롬프트에는 스킬 이름과 설명만 표시하고, 필요할 때만 `SKILL.md` 전체 내용을 로드합니다.

## 💓 하트비트

ClawCore는 OpenClaw에서 영감을 받은 경량 하트비트 메커니즘을 포함:

- **기본 간격:** 60분
- **동작:** `user/` 및 `workbench/` 폴더의 변경 사항 스캔
- **스마트 스케줄링:** 활성 대화를 중단하지 않음 — 유휴 시까지 연기
- **에이전트 태스크:** 자발적 태스크에 🤖 접두사 폴더 생성

## 📄 문서 지원

ClawCore는 `user/` 폴더의 다양한 파일 형식을 읽을 수 있습니다:

| 형식 | 라이브러리 |
|------|-----------|
| PDF | `pdf-parse` |
| Word (.docx) | `mammoth` |
| Excel (.xlsx) | `xlsx` |
| Markdown, JSON, CSV, TXT | 네이티브 |

## 🏗️ 아키텍처

```
CLI (index.ts)
  └── Agent (agent.ts)
        ├── 시스템 프롬프트 빌더 ← 소울 + 아이덴티티 + 메모리 인덱스 + 스킬
        ├── LLM 프로바이더 (OpenAI 호환)
        ├── 도구 실행기 (17개 도구 + 권한 제어)
        └── 하트비트 러너 (setInterval + 비지 가드)
```

### 내장 도구

| 도구 | 설명 |
|------|------|
| `read_file` | 파일 읽기 (문서 파싱 지원) |
| `write_file` | 파일 쓰기 (memory/ 및 workbench/만) |
| `list_dir` | 디렉토리 내용 목록 |
| `copy_to_workbench` | user/에서 태스크 폴더로 복사 |
| `create_task` | 새 태스크 폴더 생성 |
| `update_task_status` | 태스크 상태 업데이트 |
| `archive_task` | 태스크를 아카이브로 이동 |
| `memory_read` / `memory_write` / `memory_index` | 메모리 작업 |
| `read_skill` | 스킬 전체 내용 로드 |
| `create_skill` / `update_skill` | 스킬 생성·수정 (`SKILL_LOG.md`에 자동 기록) |
| `update_soul` / `update_identity` | 인격 파일 수정 |
| `complete_bootstrap` | 첫 설정 완료 |
| `exec` | 셸 명령 실행 |

## 👥 기여자

<a href="https://github.com/dataelement/ClawCore/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=dataelement/ClawCore" />
</a>

## 🤝 감사

ClawCore는 [OpenClaw](https://github.com/openclaw/openclaw)와 AI 어시스턴트에 진정한 개성을 부여하려는 비전에서 영감을 받았습니다. 영혼을 추출하여 코어로 만들었습니다.

## 📜 라이선스

MIT
