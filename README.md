# SkillHub

> **설치 전에 AI가 검증하는** 스킬 마켓플레이스

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[English](./README.en.md) | **한국어**

## 🎯 차별화

기존 스킬 마켓: 검색 → 설치 → 사용 → 판단

**SkillHub**: 검색 → **AI 품질 분석** → 추천 → 설치

- 🔍 **Frontmatter 품질 점수** — 설치 전에 품질 확인
- 🤖 **AI 추천** — 내 상황에 맞는 스킬 추천
- 💰 **비용 예측** — "이 스킬 1회 사용 ≈ $0.03"

## 📊 현재 상태

**Phase 1 진행 중** (60%)

자세한 진행 상황은 [PROGRESS.md](./docs/PROGRESS.md) 참조

## 핵심 기능

### Phase 1 (현재)
- ✅ Frontmatter 품질 분석 시스템
- ✅ 품질 점수 (S/A/B/C/D 등급)
- 🔄 GitHub OAuth 인증
- 🔄 스킬 등록/조회 API

### Phase 2
- 💬 대화형 스킬 추천 (⌘K)
- 📊 사용자 공간 (내 스킬, 북마크)

### Phase 3
- 🏆 토너먼트 시스템
- 📈 랭킹/리더보드

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14 + TypeScript + Tailwind |
| UI | woosgem DS (@woosgem-dev/react) |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Railway) |
| ORM | Prisma |
| Auth | NextAuth.js + GitHub OAuth |
| AI | Claude API (Anthropic) |
| Deploy | Vercel |

## 문서

| 문서 | 설명 |
|------|------|
| [PRD v0.3](./docs/PRD_v0.3.md) | 제품 요구사항 (최신) |
| [TC Phase 1](./docs/TC_PHASE1.md) | 테스트 케이스 |
| [Frontmatter Spec](./docs/FRONTMATTER_SPEC.md) | 3-Layer 스펙 |
| [Progress](./docs/PROGRESS.md) | 개발 진행 상황 |

## 시작하기

```bash
# 설치
pnpm install

# 환경변수 설정
cp .env.example .env
# DATABASE_URL, GITHUB_CLIENT_ID 등 설정

# DB 마이그레이션
npx prisma migrate dev

# 개발 서버
pnpm dev
```

## 팀

- 🧠 **WooSGem** — Creator & Architect
- ⚡ **Thrall** — AI Engineer

## 라이센스

MIT

---

Made with ❤️ by WooSGem & Thrall ⚡
