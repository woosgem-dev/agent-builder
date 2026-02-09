# Agent Builder - 초기 세팅 완료 보고서

> 2026-02-09 | Phase 1 MVP 기반 작업

---

## 요약

Agent Builder 프로젝트의 초기 세팅이 완료되었다. Next.js 14 프로젝트 scaffold와 skills.sh 크롤러 프로토타입을 병렬로 진행했다.

| 작업 | 상태 | 소요 시간 |
|------|------|-----------|
| Next.js 프로젝트 세팅 | 완료 | ~8분 |
| skills.sh 크롤러 프로토타입 | 완료 | ~14분 |

---

## 1. 프로젝트 구조

```
agent-builder/
├── .env                          # 환경 변수
├── .env.example                  # 환경 변수 템플릿
├── .eslintrc.json                # ESLint (next/core-web-vitals)
├── .gitignore
├── .npmrc                        # GitHub Packages registry
├── next.config.mjs               # SCSS includePaths 설정
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                 # strict, path alias @/*
│
├── prisma/
│   └── schema.prisma             # SkillIndex 모델
│
├── scripts/                      # 크롤러 (독립 실행)
│   ├── crawl-skills.ts           # 메인 크롤러 (1,169줄)
│   ├── test-parser.ts            # YAML 파서 단위 테스트
│   ├── package.json              # 크롤러 의존성
│   ├── tsconfig.json
│   └── output/
│       ├── skills-data.json      # 크롤링 결과 샘플
│       ├── site-analysis.json    # skills.sh 사이트 분석
│       └── debug-main-page.html  # 디버깅용 HTML
│
├── docs/
│   ├── plans/
│   │   └── 2026-02-09-agent-builder-design.md  # 디자인 문서
│   └── progress/
│       └── 2026-02-09-initial-setup.md         # 이 문서
│
└── src/
    ├── app/
    │   ├── layout.tsx            # 공통 레이아웃 + 네비게이션
    │   ├── page.tsx              # 홈 (서비스 소개)
    │   ├── skills/
    │   │   └── page.tsx          # Skill Finder (셸)
    │   ├── build/
    │   │   └── page.tsx          # Agent Builder (3패널 셸)
    │   └── api/
    │       ├── skills/
    │       │   ├── route.ts      # GET /api/skills (stub)
    │       │   └── sync/
    │       │       └── route.ts  # POST /api/skills/sync (stub)
    │       └── chat/
    │           └── route.ts      # POST /api/chat (stub)
    ├── lib/
    │   ├── prisma.ts             # Prisma client 싱글톤
    │   └── schemas.ts            # Zod 스키마
    ├── styles/
    │   ├── globals.scss          # 리셋 + fallback 토큰
    │   ├── layout.module.scss    # 헤더, 네비게이션
    │   ├── home.module.scss      # 홈페이지
    │   ├── skills.module.scss    # Skill Finder
    │   └── build.module.scss     # Agent Builder (2열 그리드)
    └── types/
        ├── index.ts              # re-export
        ├── agent.ts              # AgentFrontmatter, AgentDefinition
        └── skill.ts              # Skill, RawSkillListing, SkillFrontmatter
```

---

## 2. 기술 스택

| 영역 | 패키지 | 버전 |
|------|--------|------|
| Framework | Next.js (App Router) | 14.2.23 |
| UI | @woosgem-dev/react | 0.0.2 |
| Styling | @woosgem-dev/styles + SCSS | 0.0.2 |
| SCSS 컴파일 | sass | 1.97.3 |
| ORM | @prisma/client | 6.19.2 |
| DB | SQLite | (파일 기반) |
| AI | @anthropic-ai/sdk | 0.39.0 |
| Validation | zod | 3.25.76 |
| TypeScript | typescript (strict) | 5.9.3 |

### 크롤러 별도 의존성 (`scripts/`)

| 패키지 | 용도 |
|--------|------|
| cheerio | HTML 파싱 |
| yaml | YAML frontmatter 파싱 |
| tsx | TypeScript 직접 실행 |

---

## 3. 데이터 모델

### SkillIndex (Prisma + SQLite)

```prisma
model SkillIndex {
  id          String   @id @default(cuid())
  name        String
  description String
  owner       String
  repo        String
  skillId     String
  url         String
  githubUrl   String
  tags        String   // JSON 배열을 문자열로 저장
  installs    Int      @default(0)
  syncedAt    DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([owner, repo, skillId])
}
```

---

## 4. API 라우트 (stub)

모든 API는 타입 정의 + stub 상태. TODO 주석으로 구현 방향 명시.

### `GET /api/skills?q=&page=&limit=`

```typescript
interface SkillSearchResponse {
  skills: SkillSearchResult[];
  total: number;
}
```

- description, tags 기반 의도 검색
- 페이지네이션 지원

### `POST /api/skills/sync`

```typescript
interface SyncResult {
  synced: number;
  errors: number;
  message: string;
}
```

- 크롤러 트리거 (skills.sh → GitHub → DB upsert)

### `POST /api/chat`

```typescript
interface ChatResponse {
  message: ChatMessage;
  formUpdate?: AgentFormUpdate;     // 폼 자동 채움
  suggestedSkills?: string[];       // 스킬 추천
}
```

- Claude API 기반 에이전트 생성 대화
- 응답에 폼 업데이트 + 스킬 추천 포함

---

## 5. Zod 스키마

| 스키마 | 용도 |
|--------|------|
| `skillSearchParamsSchema` | 스킬 검색 파라미터 검증 |
| `chatRequestSchema` | 채팅 요청 검증 (messages + context) |
| `agentFrontmatterSchema` | 에이전트 frontmatter 검증 |

---

## 6. 타입 정의

### `AgentFrontmatter` (agent.ts)

에이전트 .md 파일의 frontmatter 필드.

```typescript
interface AgentFrontmatter {
  name: string;
  description: string;
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  tools?: string[];
  disallowedTools?: string[];
  skills?: string[];
  maxTurns?: number;
  permissionMode?: string;
  mcpServers?: Record<string, McpServerConfig>;
}
```

### `Skill` (skill.ts)

DB에 저장된 스킬 데이터.

### `RawSkillListing` / `SkillFrontmatter` (skill.ts)

크롤링 중간 데이터 타입.

---

## 7. 페이지 레이아웃

### 홈 (`/`)
- 서비스 소개 텍스트
- Skill Finder / Agent Builder 카드 (진입점)

### Skill Finder (`/skills`)
- 검색 입력 영역 (TODO)
- 결과 목록 영역 (TODO)

### Agent Builder (`/build`)
- 2열 그리드: AI Chat | Agent Settings
- 하단 전체 너비: .md Preview
- CSS Grid 기반 레이아웃 완성

---

## 8. 스타일링 구조

Tailwind 미사용. woosgem DS 토큰 기반 SCSS.

- `globals.scss`: CSS 리셋 + `:root` fallback 토큰 (DS 토큰이 로드되면 override됨)
- `layout.module.scss`: 헤더/네비게이션 (flex, border-bottom)
- `build.module.scss`: 3패널 그리드 (chat | form, preview 하단)
- 모든 스타일에서 `var(--color-*)`, `var(--space-*)`, `var(--font-*)` 토큰 사용

---

## 9. 크롤러 프로토타입

### 아키텍처

```
[1] skills.sh HTML fetch
    → cheerio로 파싱
    → 스킬 목록 추출 (name, owner, repo, skillId, installs, url)

[2] GitHub raw fetch
    → SKILL.md 파일 위치 탐색 (여러 경로 시도)
    → YAML frontmatter 파싱 (yaml 라이브러리)
    → name, description, tags 등 추출

[3] JSON 출력
    → scripts/output/skills-data.json
```

### 실행 방법

```bash
cd agent-builder/scripts
pnpm.cmd install
pnpm.cmd exec tsx crawl-skills.ts --limit 10        # Top 10 크롤링
pnpm.cmd exec tsx crawl-skills.ts --offset 10 --limit 10  # 11-20번째
pnpm.cmd exec tsx crawl-skills.ts --dry-run          # 사이트 분석만
pnpm.cmd exec tsx test-parser.ts                     # 파서 테스트 (16/16)
```

### 크롤링 테스트 결과

10개 스킬 테스트 → **7개 성공 (70%)**

| 스킬 | installs | frontmatter |
|------|----------|-------------|
| find-skills | 162,200 | name, description |
| vercel-react-best-practices | 110,600 | name, description, license, metadata |
| web-design-guidelines | 83,700 | name, description, metadata |
| frontend-design | 53,300 | name, description, license |
| vercel-composition-patterns | 30,100 | name, description, license, metadata |
| skill-creator | 26,500 | name, description, license |
| vercel-react-native-skills | 21,900 | name, description, license, metadata |

### 실패 원인 (3개)

| 스킬 | 원인 |
|------|------|
| remotion-best-practices | SKILL.md가 예상 경로에 없음 |
| agent-browser | 단일 스킬 레포, SKILL.md 없음 |
| browser-use | SKILL.md 대신 다른 파일명 사용 |

### SKILL.md 위치 패턴 (발견된 것)

- `skills/{skillId}/SKILL.md` — 가장 일반적 (anthropics, vercel-labs, obra)
- `skills/{skillId-without-prefix}/SKILL.md` — prefix stripping 필요한 경우
  - 예: `vercel-react-best-practices` → `skills/react-best-practices/SKILL.md`

### rate limiting

- 요청 간 1.5초 딜레이 적용
- GitHub 인증 토큰 없이 동작 (rate limit 주의 필요)

---

## 10. 환경 설정

### `.env` (gitignored)

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-your-api-key-here"
```

### `.npmrc`

```
@woosgem-dev:registry=https://npm.pkg.github.com
```

### 빌드 확인

```bash
pnpm.cmd build   # 성공
pnpm.cmd lint     # 통과
```

---

## 11. 다음 단계

디자인 문서 기준 남은 구현:

| 우선순위 | 작업 | 설명 |
|----------|------|------|
| 1 | 크롤러 → API 연동 | `POST /api/skills/sync`에 크롤러 로직 통합, DB upsert |
| 2 | Skill Finder 검색 UI | `/skills` 페이지 검색 입력 + 결과 목록 |
| 3 | 스킬 검색 API 구현 | `GET /api/skills` — description, tags 기반 검색 |
| 4 | Agent Builder 폼 UI | `/build` 오른쪽 패널 — frontmatter 설정 폼 |
| 5 | AI 대화 UI | `/build` 왼쪽 패널 — Claude API 연동 채팅 |
| 6 | .md 미리보기 | `/build` 하단 패널 — 실시간 렌더링 |
| 7 | 내보내기 | 클립보드 복사 + .md 다운로드 |

### 크롤러 개선 사항

- GitHub Tree API로 SKILL.md 위치 정확도 향상 (70% → 목표 90%+)
- GitHub Personal Access Token 지원 (rate limit 해결)
- 증분 크롤링 (이전 결과 캐시)
- 200개 이상 스킬 크롤링 (`?sort=recent` 등 다른 정렬 활용)
