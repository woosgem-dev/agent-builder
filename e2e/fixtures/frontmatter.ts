/**
 * E2E Test Fixtures - Frontmatter Examples
 */

// S등급 스킬 (90+ 점)
export const sGradeFrontmatter = `name: code-reviewer
description: PR과 코드 변경사항을 리뷰하고 개선점을 제안하는 스킬입니다. 코드 품질 문제를 찾아내어 해결책을 제시합니다. 보안 취약점과 성능 이슈도 함께 검토합니다.
version: 1.2.0
tags: [review, code, quality, security]
author: woosgem

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

extended:
  use-cases:
    - PR 코드 리뷰
    - 레거시 코드 분석
    - 보안 취약점 검토
  target-roles: [developer, qa, lead]
  icon: "🔍"
  license: MIT
  status: active`;

// A등급 스킬 (80-89 점)
export const aGradeFrontmatter = `name: doc-generator
description: 코드베이스를 분석하여 자동으로 문서를 생성하는 스킬입니다. README, API 문서, 변경 이력 등을 도와줍니다.
version: 1.0.0
tags: [documentation, automation]
author: woosgem

skillhub:
  runtime:
    min_model: sonnet
    tools:
      required: [Read, Write]
  resources:
    base_tokens: 2000
    context_hint: medium

extended:
  use-cases:
    - README 자동 생성
    - API 문서화
  target-roles: [developer]`;

// B등급 스킬 (70-79 점)
export const bGradeFrontmatter = `name: test-helper
description: 테스트 케이스 작성을 도와주는 스킬입니다. 코드를 분석하여 적절한 테스트를 제안합니다.
version: 1.0.0
tags: [testing]
author: woosgem

skillhub:
  runtime:
    min_model: haiku
    tools:
      required: [Read]

extended:
  use-cases:
    - 단위 테스트 생성`;

// C등급 스킬 (60-69 점)
export const cGradeFrontmatter = `name: simple-tool
description: 간단한 도구입니다.
version: 1.0.0
tags: [tool]
author: test`;

// D등급 스킬 (0-59 점)
export const dGradeFrontmatter = `name: minimal
description: test`;

// 잘못된 YAML
export const invalidYaml = `name: broken
description: [invalid: yaml
tags: unclosed`;

// 빈 frontmatter
export const emptyFrontmatter = '';

// 매우 긴 frontmatter (경계 테스트)
export const longDescription = `name: verbose-skill
description: ${'이것은 매우 긴 설명입니다. '.repeat(100)}
version: 1.0.0
tags: [test]
author: test`;
