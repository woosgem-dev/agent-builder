# SkillHub PRD v0.3

> 📋 Updated: 2026-02-08 | 시니어 리뷰 전체 반영
> 
> **리뷰어**: BE Senior, Web Senior, DBA, Design Lead, QA Lead

---

## 1. 개요

### 1.1 배경

AI 에이전트 스킬 시장이 빠르게 성장하고 있다:
- Claude Code, Codex, ChatGPT 등 에이전트 환경 확산
- 스킬 수요 증가 → 마켓플레이스 등장
- **Skillstore.io** 등 선발 주자가 이미 3,000+ 스킬 보유

**문제점:**
- 스킬이 많아질수록 "좋은 스킬" 찾기 어려움
- 설치해서 써봐야 품질을 알 수 있음
- 비개발자에게 선택 기준 부재

### 1.2 경쟁 환경

| 서비스 | 스킬 수 | 강점 | 약점 |
|--------|---------|------|------|
| **Skillstore.io** | 3,175+ | 원클릭 설치, 보안 등급, 멀티 플랫폼 | 설치 전 품질 판단 어려움 |
| **GitHub 직접** | ∞ | 자유로움 | 발견 어려움, 품질 보장 X |
| **SkillHub (우리)** | 0 → | **AI 사전 분석** | 후발 주자 |

### 1.3 비전

> **"설치 전에 AI가 검증하는 스킬 마켓플레이스"**

기존: 검색 → 설치 → 사용 → 판단
**SkillHub**: 검색 → **AI 분석** → 추천 → 설치

### 1.4 핵심 차별화: Frontmatter 기반 AI 분석

```
┌─────────────────────────────────────────────────────┐
│  사용자: "코드 리뷰 스킬 찾아줘"                      │
├─────────────────────────────────────────────────────┤
│  SkillHub AI:                                       │
│  1. 후보 스킬 10개 수집                              │
│  2. Frontmatter 분석 (품질 점수 산출)                │
│  3. 상위 3개 추천 + 분석 근거 제시                   │
├─────────────────────────────────────────────────────┤
│  "code-reviewer (95점) 추천합니다.                   │
│   이유: 명확한 use-case, 1회 사용 약 $0.03,          │
│   sonnet 모델로 충분, 의존성 없음"                   │
└─────────────────────────────────────────────────────┘
```

### 1.5 목표

**Phase 1 (MVP):**
- Frontmatter 품질 점수 시스템
- AI 기반 스킬 추천
- 기본 마켓플레이스 UI
- 사용자 공간 (내 스킬, 설치한 스킬)

**Phase 2:**
- 대화형 스킬 탐색
- 사용자 피드백 반영 추천

**Phase 3:**
- 토너먼트/랭킹
- 커뮤니티 기능

### 1.6 비목표 (MVP 제외)
- 경제 레이어 (수익 모델)
- 모바일 네이티브 앱 (반응형 웹은 지원)
- 스킬 직접 실행 (설치 가이드 제공)

---

## 2. 타겟 사용자

### 2.1 Primary: AI 도구 사용자 (비개발자 포함)

| 페르소나 | 니즈 | 고민 |
|----------|------|------|
| **기획자 민수** | PRD 작성 스킬 | "어떤 스킬이 좋은지 모르겠어" |
| **디자이너 지영** | Figma 자동화 | "설치했는데 안 맞으면 시간 낭비" |
| **QA 철수** | 테스트케이스 생성 | "비슷한 스킬이 10개인데 뭘 써야 해?" |
| **주니어 개발자 영희** | 코드 리뷰 | "토큰 많이 쓰는 스킬은 피하고 싶어" |

### 2.2 Secondary: 스킬 제작자

- 자신의 스킬 등록/홍보
- 품질 점수로 개선점 파악
- 경쟁 스킬 대비 포지셔닝

---

## 3. 핵심 기능

### 3.1 Frontmatter 품질 분석 시스템

**점수 산출 기준 (100점 만점):**

| 항목 | 배점 | 평가 기준 | 세부 로직 |
|------|------|----------|----------|
| **Core 필드 완성도** | 25점 | name, description, version, tags, author | 필드당 5점, 필수 필드 존재 여부 |
| **Description 품질** | 20점 | 길이, 구체성, 문제-해결 구조 | AI 분석: 50자 미만 0점, 문제-해결 구조 +10점 |
| **Runtime 명세** | 15점 | 모델 요구사항, 필요 도구 명시 | minModel +5, tools.required +5, tools.optional +5 |
| **Resources 힌트** | 15점 | 토큰 예측, 컨텍스트 힌트 | baseTokens +8, contextHint +7 |
| **Use-cases 명확성** | 15점 | 구체적 사용 시나리오 | 3개 이상 15점, 2개 10점, 1개 5점 |
| **Dependencies 관리** | 10점 | 의존성 명시 및 버전 관리 | 명시 +5, 버전 범위 +5 (없으면 만점) |

**등급 체계:**

| 등급 | 점수 | 뱃지 | 설명 |
|------|------|------|------|
| S | 90-100 | ⭐ Premium | 프로덕션 레디 |
| A | 80-89 | ✅ Verified | 검증됨 |
| B | 70-79 | 📋 Standard | 표준 |
| C | 60-69 | ⚠️ Basic | 기본 |
| D | 0-59 | ❌ Incomplete | 불완전 |

**수용 기준:**
- [ ] 품질 점수 100점 만점 산출
- [ ] 각 항목별 점수 breakdown 제공
- [ ] 등급(S/A/B/C/D) 자동 산출
- [ ] 점수 개선 팁 제공 (어떻게 올릴 수 있는지)
- [ ] 분석 완료 시간 < 5초

### 3.2 AI 스킬 추천 엔진

**입력:**
- 사용자 쿼리 (자연어)
- 필터 조건 (카테고리, 모델, 토큰 제한 등)

**처리:**
```
1. 쿼리 분석 → 의도 파악
2. 후보 스킬 검색 (태그, 설명 매칭)
3. Frontmatter 분석 (품질 점수)
4. 맥락 기반 랭킹
5. 추천 + 근거 생성
```

**수용 기준:**
- [ ] 자연어 쿼리로 스킬 추천 (최대 500자)
- [ ] 응답 시간 < 3초 (스트리밍 시작)
- [ ] 추천 결과 1-10개 (기본 5개)
- [ ] 각 추천에 근거 설명 포함
- [ ] 토큰 비용을 친숙한 단위로 표시 ("약 $0.03/회")
- [ ] 추천 중 취소 가능
- [ ] 추천 실패 시 명확한 에러 메시지

### 3.3 스킬 마켓플레이스

#### 3.3.1 페이지 구조 (IA)

```
/                           → 홈 (온보딩, Featured, 카테고리)
/skills                     → 목록 (필터, 검색, 정렬)
/skills/[author]/[name]     → 상세
/compare                    → 비교 (?skills=a,b,c)
/submit                     → 스킬 등록
/me                         → 내 공간 (대시보드)
  /me/skills                → 내가 등록한 스킬
  /me/installed             → 설치한 스킬
  /me/bookmarks             → 북마크
/auth/github                → OAuth callback
/auth/github/error          → OAuth 에러
```

#### 3.3.2 홈페이지
```
┌─────────────────────────────────────────────────────┐
│  🎯 온보딩 섹션 (첫 방문자용)                         │
│  "설치 전에 AI가 검증합니다"                         │
│  [3초 데모 GIF] [자세히 보기]                        │
├─────────────────────────────────────────────────────┤
│  🔍 검색바 + AI 추천 버튼 (⌘K)                      │
│  "어떤 스킬을 찾으시나요?"                           │
├─────────────────────────────────────────────────────┤
│  📊 Featured Skills (S등급)                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐                       │
│  │⭐  │ │⭐  │ │⭐  │ │⭐  │                       │
│  └────┘ └────┘ └────┘ └────┘                       │
├─────────────────────────────────────────────────────┤
│  🏷️ 카테고리별                                      │
│  [기획] [디자인] [개발] [QA] [문서화] [DevOps]       │
├─────────────────────────────────────────────────────┤
│  📈 Trending / ⭐ Top Rated / 🆕 New                │
└─────────────────────────────────────────────────────┘
```

#### 3.3.3 스킬 카드 (정보 위계 정리)
```
┌─────────────────────────────────┐
│  🔍 code-reviewer          ⭐ S │  ← 이름 + 등급 (Primary)
│  ─────────────────────────────  │
│  PR과 코드 변경사항을 리뷰...    │  ← 설명 2줄 제한 (Secondary)
│  ─────────────────────────────  │
│  🤖 sonnet | 💰 ~$0.03/회       │  ← 핵심 정보 (Tertiary)
│  👤 woosgem                     │
│  ─────────────────────────────  │
│  [상세보기]           [☐ 비교]  │  ← 액션
└─────────────────────────────────┘
```

#### 3.3.4 스킬 상세 페이지
```
┌─────────────────────────────────────────────────────┐
│  🔍 code-reviewer                              ⭐ S  │
│  by woosgem | v1.2.0 | MIT                          │
├─────────────────────────────────────────────────────┤
│  📊 AI 품질 분석                          [펼치기 ▼] │
│  ┌───────────────────────────────────────────────┐  │
│  │ Core 필드: ████████████████████ 25/25        │  │
│  │ Description: ████████████████── 18/20        │  │
│  │ Runtime: ████████████████████── 14/15        │  │
│  │ Resources: ██████████████────── 12/15        │  │
│  │ Use-cases: ████████████████████ 15/15        │  │
│  │ Dependencies: ████████████████── 11/10       │  │
│  │ ─────────────────────────────────────────    │  │
│  │ 총점: 95/100 (S등급)                          │  │
│  │                                               │  │
│  │ 💡 점수 개선 팁:                              │  │
│  │ • Resources에 contextHint 추가하면 +3점       │  │
│  └───────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  📋 Description                                     │
│  PR과 코드 변경사항을 리뷰하고 개선점을 제안...       │
├─────────────────────────────────────────────────────┤
│  🎯 Use Cases                                       │
│  • PR 코드 리뷰                                     │
│  • 레거시 코드 분석                                  │
│  • 보안 취약점 검토                                  │
├─────────────────────────────────────────────────────┤
│  ⚙️ Requirements                                    │
│  • Model: sonnet 이상                               │
│  • Tools: Read, Glob, Grep                          │
│  • Est. Cost: ~$0.03/회 (약 1,800 토큰)             │
├─────────────────────────────────────────────────────┤
│  📦 Dependencies                                    │
│  • markdown-formatter >=1.0.0                       │
├─────────────────────────────────────────────────────┤
│  [📋 설치 가이드]  [🔗 GitHub]  [🐛 이슈 리포트]     │
└─────────────────────────────────────────────────────┘
```

#### 3.3.5 AI 추천 모달 (⌘K)
```
┌─────────────────────────────────────────────────────┐
│  🤖 AI 스킬 추천                          [X] [ESC] │
├─────────────────────────────────────────────────────┤
│  💬 "코드 리뷰 도와줄 스킬 찾아줘.                   │
│      토큰은 적게 쓰면 좋겠어"                        │
├─────────────────────────────────────────────────────┤
│  🔍 분석 중... (3개 후보 검토)            [취소]    │
├─────────────────────────────────────────────────────┤
│  ✨ 추천 결과:                                      │
│                                                     │
│  1. code-reviewer (95점) ⭐ 최고 추천               │
│     → 1회 약 $0.03, sonnet OK                      │
│                                                     │
│  2. pr-analyzer (87점)                              │
│     → 기능 풍부하나 1회 약 $0.06                   │
│                                                     │
│  3. quick-review (82점)                             │
│     → 가장 저렴 ($0.01), 기능 제한적               │
├─────────────────────────────────────────────────────┤
│  💡 "토큰 효율을 원하시니 code-reviewer를            │
│      추천드립니다."                                  │
└─────────────────────────────────────────────────────┘
```

#### 3.3.6 비교 기능
```
스킬 카드 [☐ 비교] 체크 → 하단 플로팅 바 등장:
┌─────────────────────────────────────────────────────┐
│  📊 3개 선택됨  [code-reviewer] [pr-analyzer] [+1]  │
│                                      [비교하기 →]   │
└─────────────────────────────────────────────────────┘

비교 페이지 (/compare?skills=...):
┌─────────────────────────────────────────────────────┐
│  📊 스킬 비교                                       │
├─────────────────────────────────────────────────────┤
│              │ code-reviewer │ pr-analyzer │ quick │
├──────────────┼───────────────┼─────────────┼───────┤
│ 품질 점수     │ 95 ⭐         │ 87 ✅       │ 82 ✅ │
│ 예상 비용     │ ~$0.03       │ ~$0.06      │ ~$0.01│
│ 최소 모델     │ sonnet       │ sonnet      │ haiku │
│ 의존성        │ 1개          │ 0개         │ 0개   │
│ Use-cases    │ 3개          │ 5개         │ 1개   │
│ 업데이트      │ 3일 전       │ 2주 전      │ 1달 전│
└─────────────────────────────────────────────────────┘
```

#### 3.3.7 내 공간 (/me)
```
┌─────────────────────────────────────────────────────┐
│  👤 woosgem                                         │
│  ─────────────────────────────────────────────────  │
│  [내 스킬 (5)]  [설치한 스킬 (12)]  [북마크 (3)]     │
├─────────────────────────────────────────────────────┤
│  📦 내가 등록한 스킬                                 │
│  ┌────┐ ┌────┐ ┌────┐                              │
│  │⭐  │ │✅  │ │📋  │   [+ 새 스킬 등록]            │
│  └────┘ └────┘ └────┘                              │
└─────────────────────────────────────────────────────┘
```

### 3.4 스킬 등록

**수용 기준:**
- [ ] GitHub URL 입력으로 스킬 등록
- [ ] Frontmatter 자동 파싱
- [ ] 파싱 실패 시 명확한 에러 메시지 (줄 번호 포함)
- [ ] 품질 점수 즉시 미리보기
- [ ] 개선 제안 제공
- [ ] 등록 시 `status: PENDING` → 분석 완료 후 `ACTIVE`
- [ ] 중복 등록 방지 (같은 GitHub 소스)
- [ ] 버전 업데이트 자동 감지 (GitHub webhook)

### 3.5 에러 상태 & Empty State

| 상태 | UI | 액션 |
|------|-----|------|
| 검색 결과 없음 | "일치하는 스킬이 없어요" | AI 추천 유도 |
| AI 추천 실패 | "추천을 생성하지 못했어요" | 재시도 버튼 |
| GitHub 연동 실패 | "GitHub에 연결할 수 없어요" | 재시도 / URL 확인 |
| Frontmatter 파싱 실패 | "Frontmatter 형식 오류" | 오류 위치 + 수정 가이드 |
| 스킬 로딩 중 | 스켈레톤 UI | - |
| 분석 중 | 프로그레스 + 예상 시간 | 취소 가능 |
| 첫 스킬 없음 | "첫 S등급 스킬의 주인공이 되세요!" | 등록 CTA |

---

## 4. 접근성 (a11y) 요구사항

### 4.1 컴포넌트별 요구사항

| 컴포넌트 | 요구사항 |
|----------|----------|
| **ScoreBar** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| **GradeBadge** | 색상만 의존 X, `aria-label="S등급 Premium"` 형태로 텍스트 제공 |
| **SkillCard** | 전체 클릭 가능, `tabindex`, `:focus-visible` 스타일 |
| **CommandPalette** | `aria-live="polite"`, 키보드 네비게이션 (↑↓), ESC 닫기 |
| **CompareTable** | 스크린리더용 `<caption>`, `scope` 속성 |

### 4.2 전역 요구사항

- [ ] 모든 인터랙티브 요소 키보드 접근 가능
- [ ] Focus 순서 논리적
- [ ] 색상 대비 WCAG AA 충족 (4.5:1)
- [ ] 스크린리더 테스트 (NVDA/VoiceOver)

---

## 5. 인증 & 인가

### 5.1 인증 방식

- **GitHub OAuth** (필수)
- 토큰 저장: HTTP-only secure cookie
- 세션 만료: 7일 (갱신 가능)

### 5.2 권한 매트릭스

| API | 비회원 | 회원 | 스킬 소유자 |
|-----|--------|------|------------|
| GET /api/skills | ✅ | ✅ | ✅ |
| GET /api/skills/:id | ✅ | ✅ | ✅ |
| POST /api/recommend | ✅ (Rate Limited) | ✅ | ✅ |
| POST /api/skills | ❌ | ✅ | ✅ |
| PUT /api/skills/:id | ❌ | ❌ | ✅ |
| DELETE /api/skills/:id | ❌ | ❌ | ✅ |
| POST /api/skills/:id/reviews | ❌ | ✅ | ✅ |

### 5.3 인가 검증

```typescript
// 스킬 수정/삭제 시
if (skill.authorId !== currentUser.id) {
  throw new ForbiddenException('본인의 스킬만 수정할 수 있습니다');
}
```

---

## 6. 입력 검증 & 보안

### 6.1 입력 검증 (Zod 스키마)

```typescript
// 스킬 등록
const CreateSkillSchema = z.object({
  githubUrl: z.string()
    .url()
    .regex(/^https:\/\/github\.com\/[\w-]+\/[\w-]+/, 'GitHub URL 형식이 아닙니다')
    .max(500),
});

// AI 추천
const RecommendSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    maxTokens: z.number().int().positive().max(100000).optional(),
    minGrade: z.enum(['S', 'A', 'B', 'C', 'D']).optional(),
    model: z.enum(['haiku', 'sonnet', 'opus']).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(20).default(5),
});

// 리뷰
const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
```

### 6.2 보안 고려사항

| 위협 | 대응 |
|------|------|
| **XSS** | DOMPurify로 description 새니타이징 |
| **SQL Injection** | Prisma 파라미터 바인딩 (기본 제공) |
| **SSRF** | GitHub URL만 허용, 내부망 차단 |
| **Rate Limit 우회** | IP + User ID 복합 제한 |
| **악성 Frontmatter** | YAML 파서 safe mode, 깊이 제한 |

### 6.3 Rate Limiting

| API | 비회원 | 회원 |
|-----|--------|------|
| POST /api/recommend | 10회/시간 | 100회/시간 |
| POST /api/analyze | 5회/시간 | 50회/시간 |
| POST /api/skills | - | 10회/일 |
| 전체 | 100회/분 | 1000회/분 |

---

## 7. 데이터 모델 (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== 사용자 ==============

model User {
  id          String   @id @default(cuid())
  githubId    String   @unique
  username    String   @unique
  email       String?
  avatarUrl   String?
  
  skills      Skill[]
  reviews     Review[]
  bookmarks   Bookmark[]
  installs    Install[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ============== 스킬 ==============

model Skill {
  id          String   @id @default(cuid())
  
  // Core (Layer 1)
  name        String
  description String   @db.Text
  version     String
  
  // Author
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  
  // Location (Layer 2) - GitHub 소스 중복 방지
  sourceType  String   @default("github")
  sourceOwner String
  sourceRepo  String
  sourcePath  String
  sourceRef   String   @default("main")
  
  // Runtime (Layer 2)
  minModel    String?
  baseTokens  Int?
  contextHint String?
  
  // Extended (Layer 3)
  icon        String?
  license     String?
  status      SkillStatus @default(PENDING)
  
  // Relations
  tags            SkillTag[]
  requiredTools   SkillTool[]   @relation("RequiredTools")
  optionalTools   SkillTool[]   @relation("OptionalTools")
  useCases        UseCase[]
  targetRoles     TargetRole[]
  qualityScore    QualityScore?
  reviews         Review[]
  bookmarks       Bookmark[]
  installs        Install[]
  
  // Soft delete
  deletedAt   DateTime?
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([authorId, name])
  @@unique([sourceOwner, sourceRepo, sourcePath])  // GitHub 소스 중복 방지
  @@index([status])
  @@index([authorId])
  @@index([createdAt])
  @@index([deletedAt])
}

// ============== 정규화된 배열 필드 ==============

model Tag {
  id     String     @id @default(cuid())
  name   String     @unique
  skills SkillTag[]
}

model SkillTag {
  skillId String
  tagId   String
  skill   Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tagId], references: [id])
  
  @@id([skillId, tagId])
  @@index([tagId])
}

model Tool {
  id             String      @id @default(cuid())
  name           String      @unique
  requiredBy     SkillTool[] @relation("RequiredTools")
  optionalBy     SkillTool[] @relation("OptionalTools")
}

model SkillTool {
  skillId  String
  toolId   String
  required Boolean
  skill    Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade, name: required ? "RequiredTools" : "OptionalTools")
  tool     Tool   @relation(fields: [toolId], references: [id], name: required ? "RequiredTools" : "OptionalTools")
  
  @@id([skillId, toolId])
}

model UseCase {
  id       String @id @default(cuid())
  skillId  String
  content  String
  skill    Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@index([skillId])
}

model TargetRole {
  id       String @id @default(cuid())
  skillId  String
  role     String
  skill    Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  @@index([skillId])
}

// ============== 품질 점수 ==============

model QualityScore {
  id              String @id @default(cuid())
  skillId         String @unique
  skill           Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  // 항목별 점수
  coreFieldScore      Int  // /25
  descriptionScore    Int  // /20
  runtimeScore        Int  // /15
  resourcesScore      Int  // /15
  useCasesScore       Int  // /15
  dependenciesScore   Int  // /10
  
  // 총점 및 등급
  totalScore      Int
  grade           Grade
  
  // AI 분석 코멘트
  analysisComment String?  @db.Text
  improvementTips String[]
  
  // 분석 시점
  analyzedAt      DateTime @default(now())
  
  @@index([totalScore])
  @@index([grade])
}

// ============== 리뷰 ==============

model Review {
  id        String   @id @default(cuid())
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  
  rating    Int      // DB 레벨 CHECK 제약 추가 필요
  comment   String?  @db.Text
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([skillId, authorId])  // 스킬당 1리뷰
  @@index([skillId])
  @@index([createdAt])
}

// ============== 사용자 활동 ==============

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  skillId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  
  @@unique([userId, skillId])
  @@index([userId])
}

model Install {
  id        String   @id @default(cuid())
  userId    String
  skillId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  
  @@unique([userId, skillId])
  @@index([userId])
  @@index([skillId])
}

// ============== Enums ==============

enum SkillStatus {
  PENDING
  ACTIVE
  DEPRECATED
  ARCHIVED
}

enum Grade {
  S
  A
  B
  C
  D
}
```

**마이그레이션 후 추가 SQL:**
```sql
-- Review rating 범위 제약
ALTER TABLE "Review" ADD CONSTRAINT rating_range 
  CHECK (rating >= 1 AND rating <= 5);

-- 전문 검색 인덱스 (선택적)
CREATE INDEX skill_search_idx ON "Skill" 
  USING gin(to_tsvector('english', name || ' ' || description));
```

---

## 8. API 설계

### 8.1 공통 응답 형식

```typescript
// 성공
{
  "success": true,
  "data": T,
  "meta": { "page": 1, "limit": 20, "total": 100 }  // 목록용
}

// 실패
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다",
    "details": [{ "field": "query", "message": "필수 항목입니다" }]
  }
}
```

### 8.2 에러 코드

| Code | HTTP Status | 설명 |
|------|-------------|------|
| VALIDATION_ERROR | 400 | 입력 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| CONFLICT | 409 | 중복 (이미 존재) |
| RATE_LIMITED | 429 | 요청 제한 초과 |
| GITHUB_ERROR | 502 | GitHub API 오류 |
| AI_ERROR | 503 | AI 분석 오류 |

### 8.3 스킬 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/skills` | 스킬 목록 | ❌ |
| GET | `/api/skills/:author/:name` | 스킬 상세 | ❌ |
| POST | `/api/skills` | 스킬 등록 | ✅ |
| PUT | `/api/skills/:id` | 스킬 수정 | ✅ (소유자) |
| DELETE | `/api/skills/:id` | 스킬 삭제 | ✅ (소유자) |

**GET /api/skills 쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| q | string | 검색어 (name, description) |
| tags | string[] | 태그 필터 |
| grade | Grade | 최소 등급 |
| model | string | 최소 모델 |
| author | string | 작성자 필터 |
| sort | enum | `score` \| `recent` \| `popular` |
| page | number | 페이지 (기본 1) |
| limit | number | 개수 (기본 20, 최대 100) |

### 8.4 추천 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/recommend` | AI 스킬 추천 | ❌ (Rate Limited) |
| GET | `/api/recommend/featured` | Featured 스킬 | ❌ |
| GET | `/api/recommend/trending` | Trending 스킬 | ❌ |

### 8.5 분석 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/analyze` | Frontmatter 분석 (미리보기) | ❌ (Rate Limited) |
| POST | `/api/analyze/url` | GitHub URL 분석 | ❌ (Rate Limited) |

### 8.6 사용자 API

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/me` | 내 정보 | ✅ |
| GET | `/api/me/skills` | 내 스킬 | ✅ |
| GET | `/api/me/bookmarks` | 북마크 | ✅ |
| POST | `/api/me/bookmarks/:skillId` | 북마크 추가 | ✅ |
| DELETE | `/api/me/bookmarks/:skillId` | 북마크 삭제 | ✅ |
| GET | `/api/me/installs` | 설치 기록 | ✅ |
| POST | `/api/me/installs/:skillId` | 설치 기록 | ✅ |

### 8.7 Webhook API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/webhooks/github` | GitHub webhook (push 이벤트) |

- Signature 검증 필수 (`X-Hub-Signature-256`)
- 스킬 버전 자동 업데이트 트리거

---

## 9. 상태 관리 & 캐싱

### 9.1 상태 관리 전략

| 상태 유형 | 도구 | 예시 |
|-----------|------|------|
| 서버 상태 | TanStack Query | 스킬 목록, 상세 |
| URL 상태 | nuqs / searchParams | 필터, 정렬, 페이지 |
| 클라이언트 상태 | Zustand | 비교 목록, UI 상태 |

### 9.2 캐싱 전략

| 데이터 | TTL | 방식 |
|--------|-----|------|
| 스킬 목록 | 5분 | ISR (revalidate: 300) |
| 스킬 상세 | 10분 | Dynamic + cache |
| Featured/Trending | 1시간 | Static + revalidate |
| AI 추천 결과 | 5분 | 쿼리 해시 기반 Redis |
| 품질 점수 | 분석 시 갱신 | DB only |

### 9.3 낙관적 업데이트

```typescript
// 북마크 추가 예시
const addBookmark = useMutation({
  mutationFn: (skillId) => api.post(`/me/bookmarks/${skillId}`),
  onMutate: async (skillId) => {
    await queryClient.cancelQueries(['bookmarks']);
    const previous = queryClient.getQueryData(['bookmarks']);
    queryClient.setQueryData(['bookmarks'], (old) => [...old, skillId]);
    return { previous };
  },
  onError: (err, skillId, context) => {
    queryClient.setQueryData(['bookmarks'], context.previous);
  },
});
```

---

## 10. 성능 최적화

### 10.1 프론트엔드

| 영역 | 전략 |
|------|------|
| **번들** | Dynamic import (⌘K 모달, 비교 테이블) |
| **이미지** | next/image, 아바타 캐싱 |
| **렌더링** | 스킬 목록 ISR, 상세 Dynamic |
| **스트리밍** | AI 추천 응답 스트리밍 |

### 10.2 백엔드

| 영역 | 전략 |
|------|------|
| **N+1 방지** | Prisma include (author, qualityScore) |
| **페이지네이션** | Cursor 기반 권장 |
| **검색** | PostgreSQL pg_trgm 또는 별도 검색 엔진 |
| **AI 비용** | 결과 캐싱, 요청 배치 |

### 10.3 목표

- Lighthouse: 90+
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1

---

## 11. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js 14 + TypeScript | App Router, SSR, SEO |
| UI | woosgem DS (@woosgem-dev/react) | 자체 디자인 시스템 |
| Styling | Tailwind CSS | 유틸리티, DS와 조합 |
| State | TanStack Query + Zustand | 서버/클라이언트 분리 |
| Backend | Next.js API Routes | 풀스택 단일 배포 |
| Database | PostgreSQL (Railway) | 관계형, 안정적 |
| ORM | Prisma | 타입 안전, 마이그레이션 |
| Validation | Zod | 런타임 타입 검증 |
| AI | Claude API (Anthropic) | 추천 엔진 |
| Auth | NextAuth.js + GitHub OAuth | 검증된 솔루션 |
| Rate Limit | Upstash Redis | 서버리스 친화 |
| Deploy | Vercel | Next.js 최적화 |
| Monitoring | Vercel Analytics + Sentry | 성능 + 에러 |

---

## 12. 필요 DS 컴포넌트

### 12.1 신규 개발

| 컴포넌트 | 설명 | a11y 요구사항 |
|----------|------|---------------|
| `Progress` | 점수 막대 | role, aria-value* |
| `Tag` | 태그 (Badge 기반 또는 신규) | - |
| `CommandPalette` | ⌘K 모달 | aria-live, 키보드 |
| `Skeleton` | 로딩 스켈레톤 | aria-busy |
| `EmptyState` | 빈 상태 | - |

### 12.2 기존 활용

- Button, Input, Modal, Badge, Avatar, Card, Tooltip

### 12.3 다크 모드

- DS 확장 시 다크 모드 토큰 세트 포함

---

## 13. 마일스톤

| Phase | 목표 | 기간 | 산출물 |
|-------|------|------|--------|
| **Phase 1** | 기반 + 분석 | 2주 | DB, Auth, 품질 점수 |
| **Phase 2** | 마켓플레이스 UI | 2주 | 홈, 목록, 상세, 내 공간 |
| **Phase 3** | AI 추천 | 1주 | 추천 API, ⌘K |
| **Phase 4** | 스킬 등록 | 1주 | 등록, GitHub 연동 |
| **Phase 5** | 폴리싱 | 1주 | 최적화, a11y, 테스트 |

**예상 총 기간: 7주**

---

## 14. 테스트 전략

| 유형 | 도구 | 범위 |
|------|------|------|
| 단위 | Vitest | 유틸, 훅 |
| 컴포넌트 | Testing Library | DS 컴포넌트 |
| API 통합 | Vitest + Supertest | 엔드포인트 |
| E2E | Playwright | 주요 흐름 |
| 접근성 | axe-core | 자동 검사 |

**AI 추천은 모킹 처리** (비용 + 결정적 테스트)

---

## 15. 성공 지표

| 지표 | 목표 (런칭 후 1개월) |
|------|----------------------|
| 등록 스킬 수 | 100+ |
| AI 추천 요청 | 500+/월 |
| 추천 만족도 | 80%+ (👍/👎) |
| 재방문율 | 30%+ |
| Lighthouse | 90+ |
| 에러율 | < 1% |

---

## 16. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| Skillstore가 유사 기능 추가 | 품질 분석 깊이로 차별화, 한국 시장 집중 |
| AI 분석 비용 | 캐싱, Rate Limit, 분석 주기 최적화 |
| 스킬 등록 저조 | 직접 큐레이션, 인기 스킬 먼저 등록 |
| 악성 스킬 등록 | YAML safe mode, 자동 스캔, 신고 시스템 |

---

## 17. 부록

### A. 에러 시나리오 상세

| 시나리오 | 대응 |
|----------|------|
| GitHub repo 접근 불가 | "저장소에 접근할 수 없습니다. 공개 저장소인지 확인해주세요." |
| Frontmatter 파싱 실패 | "Frontmatter 형식 오류 (3번째 줄): 'tags'는 배열이어야 합니다." |
| AI 분석 타임아웃 | "분석에 시간이 걸리고 있습니다. 잠시 후 '내 스킬'에서 확인해주세요." |
| Rate Limit 초과 | "요청이 너무 많습니다. 1시간 후 다시 시도해주세요." |
| 중복 스킬 등록 | "이 스킬은 이미 등록되어 있습니다." |

### B. 시니어 리뷰 반영 체크리스트

- [x] **BE Senior**: 트랜잭션, N+1, Rate Limit, 캐싱
- [x] **Web Senior**: 라우팅, 상태 관리, 접근성, 성능
- [x] **DBA**: 인덱스, Cascade, unique 제약, 정규화
- [x] **Design Lead**: 사용자 공간, 온보딩, 에러 UI, 정보 위계
- [x] **QA Lead**: 수용 기준, 입력 검증, 에러 시나리오

---

*작성: Thrall ⚡*
*리뷰: BE Senior, Web Senior, DBA, Design Lead, QA Lead*
*승인: WooSGem*
*버전: v0.3 (2026-02-08)*
