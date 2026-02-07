# SkillHub - 기술 결정 사항

> Senior 피드백 반영 | 2026-02-07

## 확정된 결정

### 1. MVP 우선순위

| 순서 | 기능 | 이유 |
|------|------|------|
| Phase 1 | 스킬 스토어 (리스트/검색) | 핵심 가치, 빠른 개발 |
| Phase 2 | 대화형 추천 | LLM 비용 고려, 나중에 |
| Phase 3 | 토너먼트 시뮬레이션 | 실제 실행 없이 시작 |
| Phase 4 | 랭킹/리더보드 | 토너먼트 후 |

### 2. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js + TypeScript | SSR, SEO |
| UI | Tailwind + shadcn/ui | 빠른 개발 |
| Backend | Node.js + TypeScript | 통일성 |
| Database | PostgreSQL (Railway) | MVP 속도 |
| Cache | Redis (Railway) | 랭킹용 |
| Hosting | Vercel | Next.js 최적화 |
| CI/CD | GitHub Actions | 자동 배포 |

### 3. 인프라 전략

```
MVP (지금)          →    Scale (나중에)
─────────────────────────────────────────
Vercel              →    AWS CloudFront + ECS
Railway (DB/Redis)  →    RDS + ElastiCache
```

### 4. 토너먼트 전략

- MVP: **시뮬레이션만** (실제 스킬 실행 X)
- 점수는 커뮤니티 투표 or 메타데이터 기반
- 실제 실행은 샌드박스 구축 후

### 5. 대화형 추천 전략

- MVP: **규칙 기반** (카테고리 + 태그 매칭)
- LLM 기반은 비용 확보 후

### 6. 스킬 포맷

```yaml
# frontmatter 스키마
---
name: string (필수)
description: string (필수)
category: enum (필수) # planning, design, qa, dev, ...
tags: string[] (필수)
author: string (선택)
version: string (선택)
---
```

---

### 7. 플랫폼

- **Desktop only** (모바일 미지원)
- 이유: 에이전트 스킬 사용 환경 = 데스크탑
- 반응형 불필요 → 개발 속도 ↑

---

## 열린 질문 (추후 논의)

- [ ] 스킬 버전 관리 상세 설계
- [ ] 토너먼트 실제 실행 환경 (샌드박스)
- [ ] 회원가입 방식 (GitHub OAuth?)
- [ ] 커뮤니티 기능 범위

---

## 테스트 전략

### E2E / Visual Testing
- **Playwright** 사용
- 페이지별 스크린샷 테스트
- 주요 유저 플로우 테스트
- woosgem DS 시각적 검증

### 개발 루프
```
코드 작성 → Playwright 테스트 → DS 문제 발견 → DS 수정 → 반복
```

---

*결정: Admin (WooSGem) + Senior Team*
