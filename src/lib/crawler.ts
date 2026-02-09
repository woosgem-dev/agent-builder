/**
 * Skill Crawler Module
 *
 * Extracted from scripts/crawl-skills.ts for use in the Next.js API.
 * Crawls skills.sh HTML to extract skill listings, then fetches
 * SKILL.md frontmatter from each skill's GitHub repository.
 */

import * as cheerio from 'cheerio';
import { parse as parseYaml } from 'yaml';
import type {
  RawSkillListing,
  SkillFrontmatter,
  SkillMdResult,
  CrawledSkill,
  CrawlOptions,
} from '@/types/skill';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CRAWLER_CONFIG = {
  /** skills.sh base URL */
  baseUrl: 'https://skills.sh',
  /** Delay between requests in milliseconds (rate limiting) */
  requestDelay: 1500,
  /** Default limit for crawling */
  defaultLimit: 10,
  /** Maximum limit to prevent accidental full crawl */
  hardLimit: 50,
  /** HTTP request timeout in milliseconds */
  fetchTimeout: 10_000,
  /** User agent for requests */
  userAgent:
    'SkillsCrawler/0.2 (agent-builder; https://github.com/woosgem-dev/agent-builder)',
  /** Branches to try for SKILL.md */
  branches: ['main', 'master'] as readonly string[],
  /** GitHub raw content base URL */
  githubRawBase: 'https://raw.githubusercontent.com',
} as const;

// ---------------------------------------------------------------------------
// Internal Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    CRAWLER_CONFIG.fetchTimeout,
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': CRAWLER_CONFIG.userAgent,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Crawl skills.sh HTML page
// ---------------------------------------------------------------------------

/**
 * Crawl skills.sh to extract skill listings from the HTML page.
 *
 * Tries multiple strategies:
 * 1. Parse skill links directly from the main page HTML
 * 2. Try browse/explore subpages
 * 3. Fall back to a known list of popular skills
 */
export async function crawlSkillsShPage(
  options: CrawlOptions = {},
): Promise<RawSkillListing[]> {
  const limit = Math.min(
    options.limit ?? CRAWLER_CONFIG.defaultLimit,
    CRAWLER_CONFIG.hardLimit,
  );
  const offset = options.offset ?? 0;

  // Fetch main page
  const response = await fetchWithTimeout(CRAWLER_CONFIG.baseUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch skills.sh: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract skill links from HTML
  const skillLinks: Array<{ href: string; text: string }> = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();

    // Pattern: /{owner}/{repo}/{skill-id}
    if (href.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/)) {
      if (
        !href.startsWith('/api/') &&
        !href.startsWith('/auth/') &&
        !href.startsWith('/settings/') &&
        !href.startsWith('/about') &&
        !href.startsWith('/docs') &&
        !href.startsWith('/login') &&
        !href.startsWith('/signup') &&
        !href.startsWith('/search')
      ) {
        skillLinks.push({ href, text });
      }
    }
  });

  let skills: RawSkillListing[] = [];

  // Strategy 1: Parse skill links from main page
  if (skillLinks.length > 0) {
    skills = parseSkillLinks(skillLinks);
  }

  // Strategy 2: Try browse/explore subpages if main page had nothing
  if (skills.length === 0) {
    skills = await tryBrowsePages($);
  }

  // Strategy 3: Fallback to known popular skills
  if (skills.length === 0) {
    skills = getKnownPopularSkills();
  }

  // Deduplicate by owner/repo/skillId
  const seen = new Set<string>();
  const unique = skills.filter((s) => {
    const key = `${s.owner}/${s.repo}/${s.skillId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Apply offset and limit
  return unique.slice(offset, offset + limit);
}

/**
 * Parse skill links extracted from HTML into RawSkillListing objects.
 */
function parseSkillLinks(
  links: Array<{ href: string; text: string }>,
): RawSkillListing[] {
  const skills: RawSkillListing[] = [];

  for (const link of links) {
    const parts = link.href.split('/').filter(Boolean);

    if (parts.length >= 3) {
      const owner = parts[0];
      const repo = parts[1];
      const skillId = parts.slice(2).join('/');

      // Parse install count from link text (e.g., "162.2K", "53.3K")
      const installMatch = link.text.match(/([\d.]+)K\s*$/);
      const installs = installMatch
        ? Math.round(parseFloat(installMatch[1]) * 1000)
        : 0;

      skills.push({
        name: skillId,
        owner,
        repo,
        skillId,
        url: `${CRAWLER_CONFIG.baseUrl}${link.href}`,
        installs,
      });
    } else if (parts.length === 2) {
      skills.push({
        name: parts[1],
        owner: parts[0],
        repo: parts[1],
        skillId: parts[1],
        url: `${CRAWLER_CONFIG.baseUrl}${link.href}`,
        installs: 0,
      });
    }
  }

  return skills;
}

/**
 * Try fetching browse/explore subpages for skill listings.
 */
async function tryBrowsePages(
  _$: cheerio.CheerioAPI,
): Promise<RawSkillListing[]> {
  const skills: RawSkillListing[] = [];
  const browsePaths = ['/skills', '/browse', '/explore', '/discover'];

  for (const path of browsePaths) {
    try {
      const response = await fetchWithTimeout(
        `${CRAWLER_CONFIG.baseUrl}${path}`,
      );
      if (!response.ok) continue;

      const html = await response.text();
      const $ = cheerio.load(html);

      const links: Array<{ href: string; text: string }> = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const parts = href.split('/').filter(Boolean);

        if (
          parts.length >= 2 &&
          !href.startsWith('/api/') &&
          !href.startsWith('/auth/') &&
          !href.includes('.')
        ) {
          links.push({ href, text });
        }
      });

      const parsed = parseSkillLinks(links);
      if (parsed.length > 0) {
        skills.push(...parsed);
        break;
      }
    } catch {
      // Expected - pages may not exist
    }
    await sleep(500);
  }

  return skills;
}

/**
 * Known popular skills for fallback when skills.sh is not scrapable.
 * Based on the skills.sh leaderboard as of 2025.
 */
function getKnownPopularSkills(): RawSkillListing[] {
  return [
    {
      name: 'find-skills',
      owner: 'vercel-labs',
      repo: 'skills',
      skillId: 'find-skills',
      url: 'https://skills.sh/vercel-labs/skills/find-skills',
      installs: 162200,
    },
    {
      name: 'frontend-design',
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'frontend-design',
      url: 'https://skills.sh/anthropics/skills/frontend-design',
      installs: 53300,
    },
    {
      name: 'skill-creator',
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'skill-creator',
      url: 'https://skills.sh/anthropics/skills/skill-creator',
      installs: 26500,
    },
    {
      name: 'brainstorming',
      owner: 'obra',
      repo: 'superpowers',
      skillId: 'brainstorming',
      url: 'https://skills.sh/obra/superpowers/brainstorming',
      installs: 13700,
    },
    {
      name: 'pdf',
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'pdf',
      url: 'https://skills.sh/anthropics/skills/pdf',
      installs: 11300,
    },
    {
      name: 'systematic-debugging',
      owner: 'obra',
      repo: 'superpowers',
      skillId: 'systematic-debugging',
      url: 'https://skills.sh/obra/superpowers/systematic-debugging',
      installs: 7600,
    },
    {
      name: 'mcp-builder',
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'mcp-builder',
      url: 'https://skills.sh/anthropics/skills/mcp-builder',
      installs: 7100,
    },
    {
      name: 'writing-plans',
      owner: 'obra',
      repo: 'superpowers',
      skillId: 'writing-plans',
      url: 'https://skills.sh/obra/superpowers/writing-plans',
      installs: 6600,
    },
    {
      name: 'test-driven-development',
      owner: 'obra',
      repo: 'superpowers',
      skillId: 'test-driven-development',
      url: 'https://skills.sh/obra/superpowers/test-driven-development',
      installs: 6600,
    },
    {
      name: 'webapp-testing',
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'webapp-testing',
      url: 'https://skills.sh/anthropics/skills/webapp-testing',
      installs: 7700,
    },
  ];
}

// ---------------------------------------------------------------------------
// Phase 2: Fetch SKILL.md frontmatter from GitHub
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from SKILL.md content.
 * Returns null if no valid frontmatter found.
 */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const parsed = parseYaml(match[1]);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as SkillFrontmatter;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch SKILL.md from a GitHub repository and parse its frontmatter.
 *
 * Tries multiple file paths and branches:
 * 1. skills/{skillId}/SKILL.md (multi-skill repos)
 * 2. {skillId}/SKILL.md
 * 3. SKILL.md (root, single-skill repos)
 * 4. .claude/SKILL.md (older convention)
 * 5. Variations with owner/repo prefix stripping
 */
export async function fetchSkillFrontmatter(
  skill: RawSkillListing,
): Promise<SkillMdResult | null> {
  const { owner, repo, skillId } = skill;

  // Build list of possible file paths
  const filePaths: string[] = [];

  if (skillId && skillId !== repo) {
    // Multi-skill repo: try skill-specific paths first
    filePaths.push(`skills/${skillId}/SKILL.md`);
    filePaths.push(`${skillId}/SKILL.md`);
    filePaths.push(`skills/${skillId}.md`);
    filePaths.push(`${skillId}.md`);

    // Try stripping common owner/repo prefixes from skillId
    const prefixes = [owner, owner.split('-')[0], repo.split('-')[0]];
    for (const prefix of prefixes) {
      if (skillId.startsWith(`${prefix}-`)) {
        const stripped = skillId.slice(prefix.length + 1);
        filePaths.push(`skills/${stripped}/SKILL.md`);
        filePaths.push(`${stripped}/SKILL.md`);
      }
    }
  }
  filePaths.push('SKILL.md');
  filePaths.push('.claude/SKILL.md');

  for (const branch of CRAWLER_CONFIG.branches) {
    for (const filePath of filePaths) {
      const url = `${CRAWLER_CONFIG.githubRawBase}/${owner}/${repo}/${branch}/${filePath}`;

      try {
        const response = await fetchWithTimeout(url, {
          headers: {
            Accept: 'text/plain',
            'User-Agent': CRAWLER_CONFIG.userAgent,
          },
        });

        if (response.ok) {
          const content = await response.text();
          const frontmatter = parseFrontmatter(content);
          return { frontmatter, branch, path: filePath };
        }
      } catch {
        // Expected for branches/paths that don't exist
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Phase 3: Full crawl orchestration
// ---------------------------------------------------------------------------

/**
 * Run the full crawl pipeline:
 * 1. Crawl skills.sh for listings
 * 2. Fetch SKILL.md frontmatter for each skill
 * 3. Return combined results
 *
 * Includes rate limiting between GitHub requests.
 */
export async function crawlAndFetchAll(
  options: CrawlOptions = {},
): Promise<CrawledSkill[]> {
  // Phase 1: Get skill listings
  const listings = await crawlSkillsShPage(options);

  if (listings.length === 0) {
    return [];
  }

  // Phase 2: Fetch SKILL.md for each skill with rate limiting
  const results: CrawledSkill[] = [];

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];

    try {
      const skillMdResult = await fetchSkillFrontmatter(listing);

      if (skillMdResult) {
        results.push({
          listing,
          frontmatter: skillMdResult.frontmatter,
          branch: skillMdResult.branch,
          skillMdPath: skillMdResult.path,
          skillMdFound: true,
        });
      } else {
        results.push({
          listing,
          frontmatter: null,
          skillMdFound: false,
          error: 'SKILL.md not found in any expected location/branch',
        });
      }
    } catch (error) {
      results.push({
        listing,
        frontmatter: null,
        skillMdFound: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error fetching SKILL.md',
      });
    }

    // Rate limiting between GitHub requests (skip after last)
    if (i < listings.length - 1) {
      await sleep(CRAWLER_CONFIG.requestDelay);
    }
  }

  return results;
}
