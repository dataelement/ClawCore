<p align="center">
  <img src="assets/banner.jpg?v=2" alt="ClawCore Banner" width="100%" />
</p>

# ClawCore 🦐

> [OpenClaw](https://github.com/openclaw/openclaw)의 코어 버전 — 영혼을 가진 AI 어시스턴트.

[English](README.md) | [中文](README_CN.md) | [日本語](README_JA.md) | [한국어](README_KO.md) | [Español](README_ES.md)

ClawCore는 OpenClaw에서 가장 핵심적인 퍼스널리티 시스템을 추출하여 만든, 미니멀하고 자체 완결형 개인 AI 어시스턴트입니다. AI를 살아있게 만드는 소울 메커니즘은 유지하면서 인프라 복잡성은 제거했습니다.

## 🎯 왜 ClawCore인가?

### OpenClaw와의 주요 차이점

| 🦐 ClawCore | 🦞 OpenClaw |
|------------|------------|
| **인덱스 기반 메모리** — `MEMORY_INDEX.md`로 목차 관리, 벡터 DB 불필요 | 하이브리드 벡터 검색 + 임베딩 모델 |
| **경량 하트비트** — 간단한 `setInterval` 타이머 | 완전한 cron 시스템 + 서브 에이전트 |
| **인간-AI 폴더 분리** — 사용자 파일은 읽기 전용 | 공유 워크스페이스 |
| **태스크 워크벤치** — 태스크별 폴더 관리 | 태스크 폴더 개념 없음 |
| **파일 안전 설계** — AI가 원본 수정 불가, 복사본만 처리 | 더 넓은 파일 접근 |
| **일상 PC에서 안전 실행** — 전용 머신 불필요 | 서버 배포 지향 |

### 🔒 일상 컴퓨터에서 안전하게 실행

- **`user/`는 읽기 전용.** AI가 PDF, Word를 읽을 수 있지만 쓰기는 물리적으로 불가능.
- **처리는 `workbench/`에서.** 파일 편집이 필요하면 AI가 먼저 태스크 폴더로 복사.
- **모든 작업에 권한 경계.** 코드 레벨에서 강제 — 신뢰가 아니라 코드로 보호.

## 🚀 빠른 시작

```bash
git clone https://github.com/dataelement/ClawCore.git
cd ClawCore
npm install
npm run dev
```

첫 실행 시:
1. LLM API 키 설정
2. AI "각성" 대화로 자기 발견
3. 데스크톱에 `~/Desktop/ClawCore/` 워크스페이스 생성

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🧬 **소울 시스템** | `SOUL.md`로 AI가 고유한 개성 발전 |
| 🪪 **아이덴티티 각성** | 첫 실행 시 자기 발견 의식 |
| 🧠 **인덱스 기반 메모리** | `MEMORY_INDEX.md` 목차, 온디맨드 로딩 |
| 🔧 **스킬 시스템** | AI가 스킬을 자주적으로 생성·진화, `SKILL_LOG.md`에 기록 |
| 📁 **사용자 보관함** | 사용자 파일 읽기 전용 |
| 🛠️ **태스크 워크벤치** | 태스크별 폴더 + 라이프사이클 관리 |
| 💓 **하트비트 스캔** | 정기 자율 스캔, 🤖 접두사 태스크 자동 생성 |

## 🛡️ 보안

- **파일 접근** — 심볼릭 링크를 해결한 후 경로 확인
- **셸 명령** — 화이트리스트(`ls`,`cat` 등) / 블랙리스트(`rm`,`curl` 등) / 확인 메커니즘

## 🤝 감사

[OpenClaw](https://github.com/openclaw/openclaw)와 그 비전에 감사드립니다.

## 📜 라이선스

MIT
