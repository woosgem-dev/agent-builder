# SkillHub Frontmatter Specification v0.1

> Senior 피드백 반영 | 2026-02-07

## 3-Layer 구조

```
┌─────────────────────────────────────┐
│  Layer 3: Extended (정보성, 선택)    │
├─────────────────────────────────────┤
│  Layer 2: SkillHub (인덱스, 필수)    │
├─────────────────────────────────────┤
│  Layer 1: Core (Claude Skill 표준)   │
└─────────────────────────────────────┘
```

---

## Layer 1: Core (Claude Skill 표준)

기존 Claude 스킬과 100% 호환

```yaml
---
name: code-reviewer
description: 코드 리뷰를 도와주는 스킬
version: 1.0.0
tags: [review, code, quality]
author: woosgem
---
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | kebab-case, 스킬 이름 |
| description | string | ✅ | 10-1000자 설명 |
| version | string | ✅ | semver (1.0.0) |
| tags | string[] | ✅ | 최소 1개 |
| author | string | ✅ | GitHub username |

---

## Layer 2: SkillHub (인덱스/필수)

SkillHub 등록 시 필요

```yaml
skillhub:
  # 원본 위치 (구조화)
  location:
    type: github
    owner: woosgem-dev
    repo: claude-skills
    path: skills/code-reviewer.md
    ref: main
  
  # 런타임 요구사항
  runtime:
    claude_code: ">=1.0.0"
    min_model: sonnet               # haiku | sonnet | opus
    tools:
      required: [Read, Glob]
      optional: [Bash]
  
  # 리소스 힌트
  resources:
    base_tokens: 1500               # 자동 계산 (스킬 본문)
    context_hint: medium            # small | medium | large
  
  # 의존성
  dependencies:
    - id: markdown-formatter
      version: ">=1.0.0"
      optional: false
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| location | object | ✅ | 원본 위치 (구조화) |
| runtime | object | ✅ | 실행 환경 요구사항 |
| resources | object | ⭕ | 권장, 토큰/컨텍스트 힌트 |
| dependencies | array | ⭕ | 다른 스킬 의존성 |

### ID 네임스페이스

충돌 방지를 위해 `{author}/{name}` 형태 권장

```
woosgem/code-reviewer
woosgem-dev/prd-writer
```

---

## Layer 3: Extended (정보성, 선택)

풍부한 메타데이터

```yaml
extended:
  # 사용 정보
  use-cases:
    - PR 코드 리뷰
    - 레거시 코드 분석
  target-roles: [developer, qa, lead]
  
  # 표시 정보
  icon: 🔍
  # icon_url: https://...
  
  # 라이센스
  license: MIT
  
  # 생명주기
  status: active                    # active | deprecated | archived | draft
  
  # Deprecation (status가 deprecated일 때)
  deprecation:
    message: "v2.0.0으로 업그레이드 권장"
    superseded_by: woosgem/code-reviewer@2.0.0
    deprecated_at: 2026-02-07
    sunset_date: 2026-06-01
  
  # 변경 이력
  changelog:
    - version: 1.0.0
      date: 2026-01-01
      changes: ["초기 릴리즈"]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| use-cases | string[] | 사용 시나리오 |
| target-roles | string[] | 타겟 직군 |
| icon | string | 이모지 또는 URL |
| license | string | 라이센스 |
| status | enum | 생명주기 상태 |
| deprecation | object | deprecated 정보 |
| changelog | array | 버전 히스토리 |

### Status Enum

```typescript
type SkillStatus = 'draft' | 'active' | 'deprecated' | 'archived';
```

---

## Stats (별도 관리)

Frontmatter 외부, SkillHub DB에서 관리

```typescript
interface SkillStats {
  // 토너먼트
  elo_rating: number;
  total_tournaments: number;
  wins: number;
  win_rate: number;
  
  // 사용량
  usage_count: number;
  avg_tokens: number;
  p50_tokens: number;
  p95_tokens: number;
  
  // 시간
  last_used: string;
  created_at: string;
  updated_at: string;
}
```

---

## 전체 예시

```yaml
---
# Layer 1: Core
name: code-reviewer
description: PR과 코드 변경사항을 리뷰하고 개선점을 제안하는 스킬
version: 1.2.0
tags: [review, code, quality, pr]
author: woosgem

# Layer 2: SkillHub
skillhub:
  location:
    type: github
    owner: woosgem-dev
    repo: claude-skills
    path: skills/code-reviewer.md
    ref: v1.2.0
  runtime:
    claude_code: ">=1.0.0"
    min_model: sonnet
    tools:
      required: [Read, Glob, Grep]
      optional: [Bash]
  resources:
    base_tokens: 1800
    context_hint: large
  dependencies:
    - id: woosgem/markdown-formatter
      version: ">=1.0.0"

# Layer 3: Extended
extended:
  use-cases:
    - PR 코드 리뷰
    - 레거시 코드 분석
    - 보안 취약점 검토
  target-roles: [developer, qa, lead]
  icon: 🔍
  license: MIT
  status: active
---

# Code Reviewer

실제 스킬 본문...
```

---

## 열린 질문

- [ ] `estimated_tokens` 측정 방식 최종 결정
- [ ] tags 정규화 (자유 입력 vs enum)
- [ ] 실사용 통계 수집 시점/방법

---

*작성: Thrall + Senior Team*
*승인: Woosgem*
