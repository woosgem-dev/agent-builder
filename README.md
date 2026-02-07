# SkillHub

> AI 스킬의 GitHub — 누구나 쉽게 발견하고 사용

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 비전

개발자 인접 직군(기획/디자인/QA/PM)도 쉽게 AI 스킬을 발견하고 사용할 수 있는 플랫폼

## 핵심 기능

- 🏪 **스킬 마켓플레이스** — App Store 스타일 브라우징
- 💬 **대화형 추천** — 자연어로 스킬 발견 (Phase 2)
- 🏆 **토너먼트** — 스킬 경쟁으로 품질 검증
- 📊 **랭킹** — 검증된 스킬 한눈에

## 기술 스택

- **Frontend**: Next.js + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL + Redis
- **Infra**: Vercel + Railway (MVP) → AWS (Scale)

## 문서

- [PRD](./docs/PRD_v0.1.md)
- [기술 결정사항](./docs/DECISIONS.md)
- [Frontmatter 스펙](./docs/FRONTMATTER_SPEC.md)

## 팀

| 역할 | 담당 |
|------|------|
| Admin | Woosgem |
| Backend | BE-Senior |
| Frontend | Web-Senior |
| Database | DBA |
| Infra | DevOps |

## 시작하기

```bash
# 설치
pnpm install

# 개발 서버
pnpm dev

# 빌드
pnpm build
```

## 라이센스

MIT
