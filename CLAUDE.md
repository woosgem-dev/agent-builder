# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Builder is a Next.js 14 (App Router) web app for assembling Claude Code agent `.md` files through a GUI + AI chat interface. It crawls skills.sh for skill metadata, stores it in SQLite via Prisma, and lets users search/compose agents.

## Rules 
MUST FOLLOW THESE RULES:
- run `simplify code` on any code changes
- run `pnpm lint` and `pnpm build` after changing any code


## Commands

```bash
pnpm dev              # Start dev server (Next.js)
pnpm build            # Production build
pnpm lint             # ESLint (next/core-web-vitals)
pnpm db:generate      # Prisma generate client
pnpm db:push          # Push schema to SQLite
pnpm db:studio        # Open Prisma Studio
npx tsx scripts/crawl-skills.ts              # Run crawler prototype
npx tsx scripts/crawl-skills.ts --limit 20   # Custom limit
npx tsx scripts/test-parser.ts               # Test YAML frontmatter parser
```

## Tech Stack

- **Framework**: Next.js 14.2 (App Router), React 18, TypeScript 5
- **Package manager**: pnpm
- **Database**: SQLite via Prisma (`prisma/schema.prisma`)
- **AI**: Anthropic SDK (`@anthropic-ai/sdk`) — chat API not yet implemented
- **Styling**: SASS modules (`src/styles/*.module.scss`) + design system (`@woosgem-dev/styles`, `@woosgem-dev/react` via GitHub Packages)
- **Validation**: Zod (`src/lib/schemas.ts`)
- **Crawling**: Cheerio + YAML parser

## Architecture

### Data Flow

```
skills.sh (HTML) → Crawler → SKILL.md (GitHub raw) → Prisma (SQLite) → API → UI
```

1. **Crawler** (`src/lib/crawler.ts`): Scrapes skills.sh HTML for skill listings, then fetches SKILL.md frontmatter from GitHub repos. Multi-strategy: HTML parsing → browse subpages → hardcoded fallback list. Rate-limited (1.5s between requests).

2. **Sync** (`src/lib/skill-sync.ts`): Upserts crawled data into `SkillIndex` table. Unique constraint on `[owner, repo, skillId]`.

3. **API Routes**:
   - `POST /api/skills/sync` — Trigger crawl + DB sync pipeline
   - `GET /api/skills?q=&page=&limit=` — Search skills (description, tags, name)
   - `POST /api/chat` — AI chat for agent building (stub, not yet implemented)

4. **Pages**:
   - `/` — Landing with links to Skill Finder and Agent Builder
   - `/skills` — Skill search UI (stub)
   - `/build` — 3-panel layout: AI Chat | Agent Settings | .md Preview (stub)

### Key Types

- `src/types/skill.ts` — `Skill`, `RawSkillListing`, `SkillFrontmatter`, `CrawledSkill`, `SkillMdResult`, `CrawlOptions`, `SyncResult`
- `src/types/agent.ts` — `AgentFrontmatter`, `AgentDefinition`, `McpServerConfig`
- `src/lib/schemas.ts` — Zod schemas for API validation (`skillSearchParamsSchema`, `chatRequestSchema`, `agentFrontmatterSchema`)

### Path Aliases

`@/*` maps to `./src/*` (tsconfig paths).

### External Dependencies

The design system packages (`@woosgem-dev/react`, `@woosgem-dev/styles`) are installed from GitHub Packages (`npm.pkg.github.com`). Auth token is configured in `.npmrc` (gitignored).

### Scripts Directory

`scripts/` contains standalone crawl prototypes (excluded from tsconfig). Run with `npx tsx`. The crawler logic was later extracted into `src/lib/crawler.ts` for use in the Next.js API.

## Environment Variables

See `.env.example`:
- `DATABASE_URL` — SQLite file path (default: `file:./dev.db`)
- `ANTHROPIC_API_KEY` — Required for chat API (not yet wired up)

## TypeScript Code Navigation (ts-mcp)

This project has ts-mcp installed. Try ts-mcp tools first,
fall back to Grep/Read when they fail or return incorrect results.

- Symbol definition → `goto_definition` (fallback: Grep)
- Symbol references → `find_references` (fallback: Grep)
- Symbol search → `workspace_symbols` (fallback: Grep)
- File structure → `document_symbols` (fallback: Read)
- Type navigation → `goto_type_definition`
- Member listing → `list_members`
- Call chain → `call_hierarchy`
- Type implementations → `type_hierarchy`
- Change impact → `impact_analysis`
- Type/docs info → `get_type_info`
- Rename → `rename_symbol`
- Errors → `diagnostics` (known bug: false errors on pnpm, fallback: `tsc --noEmit`)

### ts-mcp Bug Reporting

When ts-mcp produces incorrect results, do NOT modify ts-mcp source.
Instead, write a bug report to `~/Desktop/Workspace/ts-mcp/docs/` and
use standard tools (Grep, Read, Bash) as fallback.
