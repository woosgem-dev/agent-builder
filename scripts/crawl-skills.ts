/**
 * skills.sh Crawler Prototype
 *
 * Crawls skills.sh to collect Claude Code skill metadata,
 * then fetches SKILL.md frontmatter from each skill's GitHub repository.
 *
 * Usage:
 *   pnpm crawl                          # Crawl with default limit (10)
 *   pnpm crawl:limit                    # Crawl with limit 5
 *   pnpm crawl -- --limit 20            # Custom limit
 *   pnpm crawl -- --offset 10 --limit 5 # Skip first 10, take next 5
 *   pnpm crawl:dry                      # Dry run (site analysis only)
 */

import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillListEntry {
  /** Skill name as displayed on skills.sh */
  name: string;
  /** GitHub owner (user/org) */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Skill identifier within the repo (may match name) */
  skillId: string;
  /** Full skills.sh URL */
  skillsShUrl: string;
  /** Install count if available */
  installs?: number;
  /** Short description from skills.sh listing (if available) */
  listingDescription?: string;
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  tags?: string[];
  "allowed-tools"?: string[];
  [key: string]: unknown;
}

interface SkillData extends SkillListEntry {
  /** Raw SKILL.md content (frontmatter only) */
  frontmatter: SkillFrontmatter | null;
  /** Branch where SKILL.md was found */
  branch?: string;
  /** File path where SKILL.md was found */
  skillMdPath?: string;
  /** Whether SKILL.md fetch was successful */
  skillMdFound: boolean;
  /** Error message if fetch failed */
  error?: string;
}

interface CrawlResult {
  crawledAt: string;
  totalFound: number;
  totalCrawled: number;
  successful: number;
  failed: number;
  skills: SkillData[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG = {
  /** skills.sh base URL */
  baseUrl: "https://skills.sh",
  /** Delay between requests in milliseconds */
  requestDelay: 1500,
  /** Maximum number of skills to crawl (prototype safety) */
  defaultLimit: 10,
  /** Maximum limit to prevent accidental full crawl */
  hardLimit: 50,
  /** HTTP request timeout in milliseconds */
  fetchTimeout: 10_000,
  /** User agent for requests */
  userAgent:
    "SkillsCrawler/0.1 (prototype; https://github.com/woosgem-dev/agent-builder)",
  /** Output directory */
  outputDir: resolve(__dirname, "output"),
  /** Branches to try for SKILL.md */
  branches: ["main", "master"],
  /** GitHub raw content base URL */
  githubRawBase: "https://raw.githubusercontent.com",
} as const;

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  limit: number;
  offset: number;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let limit = CONFIG.defaultLimit;
  let offset = 0;
  let dryRun = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = Math.min(parseInt(args[i + 1], 10) || CONFIG.defaultLimit, CONFIG.hardLimit);
      i++;
    }
    if (args[i] === "--offset" && args[i + 1]) {
      offset = parseInt(args[i + 1], 10) || 0;
      i++;
    }
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--verbose" || args[i] === "-v") verbose = true;
  }

  return { limit, offset, dryRun, verbose };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.fetchTimeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function log(message: string, level: "info" | "warn" | "error" | "debug" = "info"): void {
  const prefix = {
    info: "[INFO]",
    warn: "[WARN]",
    error: "[ERROR]",
    debug: "[DEBUG]",
  }[level];
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`${timestamp} ${prefix} ${message}`);
}

// ---------------------------------------------------------------------------
// Phase 0: Site Analysis - Discover skills.sh structure
// ---------------------------------------------------------------------------

interface SiteAnalysis {
  /** Whether the site uses SSR or client-side rendering */
  renderingType: "ssr" | "csr" | "unknown";
  /** Any API endpoints discovered */
  apiEndpoints: string[];
  /** Pagination mechanism */
  pagination: string;
  /** List of skill links found on main page */
  skillLinks: Array<{ href: string; text: string }>;
  /** Raw HTML snippet for debugging */
  htmlSnippet: string;
  /** Any JSON data found embedded in the page */
  embeddedData: unknown | null;
}

async function analyzeSite(): Promise<SiteAnalysis> {
  log("Analyzing skills.sh site structure...");

  const analysis: SiteAnalysis = {
    renderingType: "unknown",
    apiEndpoints: [],
    pagination: "unknown",
    skillLinks: [],
    htmlSnippet: "",
    embeddedData: null,
  };

  try {
    // Fetch main page
    const response = await fetchWithTimeout(CONFIG.baseUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Save raw HTML for debugging
    const debugPath = resolve(CONFIG.outputDir, "debug-main-page.html");
    writeFileSync(debugPath, html, "utf-8");
    log(`Raw HTML saved to ${debugPath}`);

    // Check rendering type
    if ($("script[src*='_next']").length > 0 || html.includes("__NEXT_DATA__")) {
      analysis.renderingType = "ssr";
      log("Detected Next.js SSR application");
    } else if ($("script[src*='chunk']").length > 0 || $("div#root").length > 0) {
      analysis.renderingType = "csr";
      log("Detected client-side rendered application");
    }

    // Try to extract __NEXT_DATA__ or similar embedded JSON
    const nextDataScript = $("script#__NEXT_DATA__").html();
    if (nextDataScript) {
      try {
        analysis.embeddedData = JSON.parse(nextDataScript);
        log("Found embedded __NEXT_DATA__");
        const dataPath = resolve(CONFIG.outputDir, "debug-next-data.json");
        writeFileSync(dataPath, JSON.stringify(analysis.embeddedData, null, 2), "utf-8");
        log(`Next.js data saved to ${dataPath}`);
      } catch {
        log("Failed to parse __NEXT_DATA__", "warn");
      }
    }

    // Look for any inline JSON data (common patterns)
    $("script").each((_, el) => {
      const content = $(el).html() || "";
      // Look for patterns like window.__data = {...} or self.__next_f.push(...)
      if (
        content.includes("window.__") ||
        content.includes("__NUXT__") ||
        content.includes("__INITIAL_STATE__")
      ) {
        log("Found embedded state data in script tag");
      }
    });

    // Extract all links that look like skill pages
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();

      // Pattern: /{owner}/{repo}/{skill-id} or similar
      if (href.match(/^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+/)) {
        // Exclude common non-skill links
        if (
          !href.startsWith("/api/") &&
          !href.startsWith("/auth/") &&
          !href.startsWith("/settings/") &&
          !href.startsWith("/about") &&
          !href.startsWith("/docs") &&
          !href.startsWith("/login") &&
          !href.startsWith("/signup") &&
          !href.startsWith("/search")
        ) {
          analysis.skillLinks.push({ href, text });
        }
      }
    });

    // Look for API patterns in script sources
    $("script[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      if (src.includes("api") || src.includes("_next")) {
        analysis.apiEndpoints.push(src);
      }
    });

    // Check for pagination elements
    if ($('[class*="pagination"]').length > 0 || $('nav[aria-label*="page"]').length > 0) {
      analysis.pagination = "traditional";
    } else if ($('[class*="load-more"]').length > 0 || $('[class*="infinite"]').length > 0) {
      analysis.pagination = "infinite-scroll";
    } else if (html.includes("cursor") || html.includes("offset") || html.includes("page=")) {
      analysis.pagination = "api-based";
    }

    // Save first 500 chars as snippet
    analysis.htmlSnippet = html.slice(0, 500);

    log(`Found ${analysis.skillLinks.length} potential skill links on main page`);
    log(`Rendering type: ${analysis.renderingType}`);
    log(`Pagination: ${analysis.pagination}`);
  } catch (error) {
    log(`Failed to analyze site: ${error instanceof Error ? error.message : String(error)}`, "error");
  }

  return analysis;
}

// ---------------------------------------------------------------------------
// Phase 0.5: Try to discover API endpoints
// ---------------------------------------------------------------------------

async function discoverApi(): Promise<SkillListEntry[]> {
  log("Attempting to discover API endpoints...");

  const skills: SkillListEntry[] = [];

  // Common API patterns to try
  const apiPaths = [
    "/api/skills",
    "/api/v1/skills",
    "/api/skills?limit=10",
    "/api/search?q=",
    "/api/popular",
    "/api/recent",
    "/api/trending",
    // Next.js API routes
    "/api/trpc/skill.list",
    "/api/trpc/skill.search",
  ];

  for (const path of apiPaths) {
    try {
      const url = `${CONFIG.baseUrl}${path}`;
      log(`Trying API: ${url}`, "debug");

      const response = await fetchWithTimeout(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": CONFIG.userAgent,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          const data = await response.json();
          log(`API endpoint found: ${path} (${response.status})`, "info");

          const apiDataPath = resolve(CONFIG.outputDir, `debug-api-${path.replace(/[\/\?=&]/g, "_")}.json`);
          writeFileSync(apiDataPath, JSON.stringify(data, null, 2), "utf-8");
          log(`API response saved to ${apiDataPath}`);

          // Try to extract skills from the response
          const extracted = extractSkillsFromApiResponse(data);
          if (extracted.length > 0) {
            log(`Extracted ${extracted.length} skills from API`);
            skills.push(...extracted);
            return skills; // Found working API, return early
          }
        }
      }
    } catch {
      // Expected - most paths won't exist
    }
    await sleep(500);
  }

  // Try fetching category/sorting pages
  const sortPages = [
    "?sort=popular",
    "?sort=recent",
    "?sort=installs",
    "/popular",
    "/recent",
    "/trending",
    "/explore",
  ];

  for (const path of sortPages) {
    try {
      const url = `${CONFIG.baseUrl}${path}`;
      const response = await fetchWithTimeout(url);
      if (response.ok && response.url !== `${CONFIG.baseUrl}/`) {
        log(`Found page: ${url} -> ${response.url}`, "debug");
      }
    } catch {
      // Expected
    }
    await sleep(300);
  }

  return skills;
}

function extractSkillsFromApiResponse(data: unknown): SkillListEntry[] {
  const skills: SkillListEntry[] = [];

  if (!data || typeof data !== "object") return skills;

  // Try common response shapes
  const candidates = [
    (data as Record<string, unknown>)["skills"],
    (data as Record<string, unknown>)["data"],
    (data as Record<string, unknown>)["items"],
    (data as Record<string, unknown>)["results"],
    Array.isArray(data) ? data : null,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;

    for (const item of candidate) {
      if (typeof item !== "object" || !item) continue;

      const record = item as Record<string, unknown>;
      const name = (record["name"] || record["title"] || record["skill_name"]) as string;
      const owner = (record["owner"] || record["user"] || record["author"]) as string;
      const repo = (record["repo"] || record["repository"]) as string;

      if (name || (owner && repo)) {
        skills.push({
          name: name || "unknown",
          owner: owner || "unknown",
          repo: repo || "unknown",
          skillId: (record["id"] || record["skill_id"] || name || "unknown") as string,
          skillsShUrl: `${CONFIG.baseUrl}/${owner}/${repo}/${record["id"] || name}`,
          installs: typeof record["installs"] === "number" ? record["installs"] : undefined,
          listingDescription: (record["description"] || record["summary"]) as string | undefined,
        });
      }
    }

    if (skills.length > 0) break;
  }

  return skills;
}

// ---------------------------------------------------------------------------
// Phase 1: Extract skill list from HTML
// ---------------------------------------------------------------------------

async function extractSkillsFromHtml(
  analysis: SiteAnalysis,
  limit: number
): Promise<SkillListEntry[]> {
  log("Extracting skills from HTML...");
  const skills: SkillListEntry[] = [];

  // Strategy 1: Extract from embedded __NEXT_DATA__ or similar
  if (analysis.embeddedData) {
    const embedded = extractSkillsFromApiResponse(analysis.embeddedData);
    if (embedded.length > 0) {
      log(`Extracted ${embedded.length} skills from embedded data`);
      skills.push(...embedded);
    }

    // Deep search in Next.js data structure
    const nextData = analysis.embeddedData as Record<string, unknown>;
    if (nextData["props"]?.["pageProps"]) {
      const pageProps = nextData["props"]["pageProps"] as Record<string, unknown>;
      const fromPage = extractSkillsFromApiResponse(pageProps);
      if (fromPage.length > 0) {
        log(`Extracted ${fromPage.length} skills from pageProps`);
        skills.push(...fromPage);
      }
    }
  }

  // Strategy 2: Parse skill links from HTML
  // skills.sh link text pattern: "{rank}{skillName}{owner}/{repo}{installs}"
  // Example: "1find-skillsvercel-labs/skills162.2K"
  if (skills.length === 0 && analysis.skillLinks.length > 0) {
    log(`Parsing ${analysis.skillLinks.length} skill links from HTML`);

    for (const link of analysis.skillLinks) {
      // Expected href pattern: /{owner}/{repo}/{skill-id}
      const parts = link.href.split("/").filter(Boolean);
      if (parts.length >= 3) {
        const owner = parts[0];
        const repo = parts[1];
        const skillId = parts.slice(2).join("/"); // Handle skill IDs with colons like "react:components"
        const name = skillId;

        // Parse install count from link text (e.g., "162.2K", "53.3K", "1.4K")
        const installMatch = link.text.match(/([\d.]+)K\s*$/);
        const installs = installMatch
          ? Math.round(parseFloat(installMatch[1]) * 1000)
          : undefined;

        skills.push({
          name,
          owner,
          repo,
          skillId,
          skillsShUrl: `${CONFIG.baseUrl}${link.href}`,
          installs,
        });
      } else if (parts.length === 2) {
        skills.push({
          name: parts[1],
          owner: parts[0],
          repo: parts[1],
          skillId: parts[1],
          skillsShUrl: `${CONFIG.baseUrl}${link.href}`,
        });
      }
    }
  }

  // Strategy 3: If main page has no skills, try paginated/search endpoints
  if (skills.length === 0) {
    log("No skills found on main page. Trying search/browse pages...");

    const browsePaths = ["/skills", "/browse", "/explore", "/discover"];
    for (const path of browsePaths) {
      try {
        const response = await fetchWithTimeout(`${CONFIG.baseUrl}${path}`);
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          $("a[href]").each((_, el) => {
            const href = $(el).attr("href") || "";
            const text = $(el).text().trim();
            const parts = href.split("/").filter(Boolean);

            if (
              parts.length >= 2 &&
              !href.startsWith("/api/") &&
              !href.startsWith("/auth/") &&
              !href.includes(".")
            ) {
              skills.push({
                name: parts[parts.length - 1] || text,
                owner: parts[0],
                repo: parts[1],
                skillId: parts[2] || parts[1],
                skillsShUrl: `${CONFIG.baseUrl}${href}`,
                listingDescription: text || undefined,
              });
            }
          });

          if (skills.length > 0) {
            log(`Found ${skills.length} skills on ${path}`);
            break;
          }
        }
      } catch {
        // Expected
      }
      await sleep(500);
    }
  }

  // Deduplicate by skillsShUrl
  const seen = new Set<string>();
  const unique = skills.filter((s) => {
    const key = `${s.owner}/${s.repo}/${s.skillId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  log(`Found ${unique.length} unique skills (limit: ${limit})`);
  return unique.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Phase 1.5: Scrape individual skill pages for more detail
// ---------------------------------------------------------------------------

async function enrichSkillFromPage(skill: SkillListEntry): Promise<Partial<SkillListEntry>> {
  try {
    const response = await fetchWithTimeout(skill.skillsShUrl);
    if (!response.ok) return {};

    const html = await response.text();
    const $ = cheerio.load(html);

    const enriched: Partial<SkillListEntry> = {};

    // Try to find install count
    const installText = $('[class*="install"], [class*="download"]').text();
    const installMatch = installText.match(/[\d,]+/);
    if (installMatch) {
      enriched.installs = parseInt(installMatch[0].replace(/,/g, ""), 10);
    }

    // Try to find description
    const desc =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      $('[class*="description"]').first().text().trim();

    if (desc) {
      enriched.listingDescription = desc;
    }

    // Try to find GitHub link (to confirm owner/repo)
    $("a[href*='github.com']").each((_, el) => {
      const ghHref = $(el).attr("href") || "";
      const match = ghHref.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
      if (match) {
        enriched.owner = match[1];
        enriched.repo = match[2];
      }
    });

    return enriched;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Fetch SKILL.md from GitHub
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): SkillFrontmatter | null {
  // Match YAML frontmatter between --- delimiters
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const parsed = parseYaml(match[1]);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as SkillFrontmatter;
    }
    return null;
  } catch (error) {
    log(
      `Failed to parse YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`,
      "warn"
    );
    return null;
  }
}

async function fetchSkillMd(
  owner: string,
  repo: string,
  skillId?: string
): Promise<{ frontmatter: SkillFrontmatter | null; branch: string; path: string } | null> {
  // Build list of possible file paths to try
  // skills.sh repos can have SKILL.md at different locations:
  // 1. skills/{skillId}/SKILL.md (multi-skill repos like vercel-labs/skills, anthropics/skills)
  // 2. {skillId}/SKILL.md (multi-skill repos with flat structure)
  // 3. Root: SKILL.md (single-skill repos)
  // 4. .claude/SKILL.md (older convention)
  //
  // Some repos use .md files directly instead of SKILL.md:
  // 5. skills/{skillId}.md
  // 6. {skillId}.md
  const filePaths: string[] = [];

  if (skillId && skillId !== repo) {
    // Multi-skill repo: try skill-specific paths first
    filePaths.push(`skills/${skillId}/SKILL.md`);
    filePaths.push(`${skillId}/SKILL.md`);
    filePaths.push(`skills/${skillId}.md`);
    filePaths.push(`${skillId}.md`);

    // Some repos prefix skill IDs on skills.sh (e.g., "vercel-react-best-practices"
    // maps to "skills/react-best-practices/" in the repo). Try stripping common prefixes.
    const prefixes = [owner, owner.split("-")[0], repo.split("-")[0]];
    for (const prefix of prefixes) {
      if (skillId.startsWith(`${prefix}-`)) {
        const stripped = skillId.slice(prefix.length + 1);
        filePaths.push(`skills/${stripped}/SKILL.md`);
        filePaths.push(`${stripped}/SKILL.md`);
      }
    }
  }
  filePaths.push("SKILL.md");
  filePaths.push(".claude/SKILL.md");

  for (const branch of CONFIG.branches) {
    for (const filePath of filePaths) {
      const url = `${CONFIG.githubRawBase}/${owner}/${repo}/${branch}/${filePath}`;

      try {
        const response = await fetchWithTimeout(url, {
          headers: {
            Accept: "text/plain",
            "User-Agent": CONFIG.userAgent,
          },
        });

        if (response.ok) {
          const content = await response.text();
          const frontmatter = parseFrontmatter(content);
          log(`  Found ${filePath} on ${branch} branch`);
          return { frontmatter, branch, path: filePath };
        }
      } catch {
        // Expected for branches/paths that don't exist
      }
    }

  }

  // Last resort: use GitHub API to search for SKILL.md in the repo
  // Runs once after all branches are exhausted
  if (skillId) {
    try {
      const apiUrl = `https://api.github.com/search/code?q=filename:SKILL.md+repo:${owner}/${repo}+path:${skillId}`;
      const response = await fetchWithTimeout(apiUrl, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": CONFIG.userAgent,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as {
          items?: Array<{ path: string }>;
        };

        if (data.items && data.items.length > 0) {
          const foundPath = data.items[0].path;
          for (const branch of CONFIG.branches) {
            const rawUrl = `${CONFIG.githubRawBase}/${owner}/${repo}/${branch}/${foundPath}`;
            const rawResponse = await fetchWithTimeout(rawUrl, {
              headers: { Accept: "text/plain", "User-Agent": CONFIG.userAgent },
            });

            if (rawResponse.ok) {
              const content = await rawResponse.text();
              const frontmatter = parseFrontmatter(content);
              log(`  Found via API: ${foundPath} on ${branch} branch`);
              return { frontmatter, branch, path: foundPath };
            }
          }
        }
      }
    } catch {
      // GitHub API search may fail due to rate limits
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Phase 3: Main crawl orchestration
// ---------------------------------------------------------------------------

async function crawl(args: CliArgs): Promise<CrawlResult> {
  const startTime = Date.now();

  log("=".repeat(60));
  log("skills.sh Crawler Prototype v0.1");
  log(`Mode: ${args.dryRun ? "DRY RUN (analysis only)" : "CRAWL"}`);
  log(`Limit: ${args.limit} skills`);
  log("=".repeat(60));

  // Ensure output directory exists
  mkdirSync(CONFIG.outputDir, { recursive: true });

  // Phase 0: Analyze site
  const analysis = await analyzeSite();

  // Save analysis
  const analysisPath = resolve(CONFIG.outputDir, "site-analysis.json");
  writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), "utf-8");
  log(`Site analysis saved to ${analysisPath}`);

  if (args.dryRun) {
    log("Dry run complete. Check output/ directory for analysis results.");
    return {
      crawledAt: new Date().toISOString(),
      totalFound: analysis.skillLinks.length,
      totalCrawled: 0,
      successful: 0,
      failed: 0,
      skills: [],
    };
  }

  // Phase 0.5: Try API discovery (skip if we already have skill links from HTML)
  let skillList: SkillListEntry[] = [];
  if (analysis.skillLinks.length === 0) {
    skillList = await discoverApi();
  } else {
    log("Skipping API discovery: HTML parsing found skill links directly");
  }

  // Phase 1: Extract skills from HTML if API didn't work
  if (skillList.length === 0) {
    const allSkills = await extractSkillsFromHtml(analysis, args.offset + args.limit);
    skillList = allSkills.slice(args.offset, args.offset + args.limit);
    log(`Applied offset ${args.offset}: taking skills ${args.offset + 1}-${args.offset + skillList.length}`);
  } else {
    skillList = skillList.slice(args.offset, args.offset + args.limit);
  }

  // If we still have nothing, try to use a fallback approach
  if (skillList.length === 0) {
    log("Could not discover skills via API or HTML.", "warn");
    log("Trying fallback: fetch well-known skill pages directly...", "info");
    skillList = await fetchFallbackSkills(args.limit);
  }

  if (skillList.length === 0) {
    log("No skills found. The site may require JavaScript rendering.", "error");
    log("Consider using Puppeteer or Playwright for a full browser-based approach.", "error");

    return {
      crawledAt: new Date().toISOString(),
      totalFound: 0,
      totalCrawled: 0,
      successful: 0,
      failed: 0,
      skills: [],
    };
  }

  log(`\nStarting Phase 2: Fetching SKILL.md for ${skillList.length} skills...`);
  log("-".repeat(60));

  // Phase 2: Fetch SKILL.md for each skill
  const results: SkillData[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < skillList.length; i++) {
    const skill = skillList[i];
    log(`[${i + 1}/${skillList.length}] ${skill.owner}/${skill.repo} (${skill.name})`);

    // Optionally enrich from individual skill page (skip to save time in prototype)
    // The skills.sh detail page often has the same generic meta description,
    // so SKILL.md frontmatter description is more valuable.
    // Enrichment is most useful for confirming GitHub owner/repo.
    if (false) {
      try {
        const enriched = await enrichSkillFromPage(skill);
        Object.assign(skill, enriched);
      } catch {
        // Non-critical
      }
      await sleep(CONFIG.requestDelay);
    }

    // Fetch SKILL.md from GitHub
    const skillMdResult = await fetchSkillMd(skill.owner, skill.repo, skill.skillId);

    if (skillMdResult) {
      results.push({
        ...skill,
        frontmatter: skillMdResult.frontmatter,
        branch: skillMdResult.branch,
        skillMdPath: skillMdResult.path,
        skillMdFound: true,
      });
      successful++;
      log(`  -> SKILL.md found (branch: ${skillMdResult.branch}, path: ${skillMdResult.path})`);

      if (skillMdResult.frontmatter) {
        log(`     Name: ${skillMdResult.frontmatter.name || "N/A"}`);
        log(`     Desc: ${(skillMdResult.frontmatter.description || "N/A").slice(0, 80)}`);
      }
    } else {
      results.push({
        ...skill,
        frontmatter: null,
        skillMdFound: false,
        error: "SKILL.md not found in any expected location/branch",
      });
      failed++;
      log("  -> SKILL.md NOT found", "warn");
    }

    // Rate limiting between GitHub requests
    if (i < skillList.length - 1) {
      await sleep(CONFIG.requestDelay);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Phase 3: Save results
  const result: CrawlResult = {
    crawledAt: new Date().toISOString(),
    totalFound: skillList.length,
    totalCrawled: results.length,
    successful,
    failed,
    skills: results,
  };

  const outputPath = resolve(CONFIG.outputDir, "skills-data.json");
  writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  // Summary
  log("\n" + "=".repeat(60));
  log("CRAWL SUMMARY");
  log("=".repeat(60));
  log(`Total skills found:   ${result.totalFound}`);
  log(`Total crawled:        ${result.totalCrawled}`);
  log(`SKILL.md found:       ${result.successful}`);
  log(`SKILL.md missing:     ${result.failed}`);
  log(`Time elapsed:         ${elapsed}s`);
  log(`Output:               ${outputPath}`);
  log("=".repeat(60));

  // Print table of results
  log("\nResults:");
  log("-".repeat(80));
  log(
    padRight("Owner/Repo", 40) +
    padRight("Name", 25) +
    padRight("SKILL.md", 10)
  );
  log("-".repeat(80));

  for (const s of results) {
    log(
      padRight(`${s.owner}/${s.repo}`, 40) +
      padRight(s.frontmatter?.name || s.name || "?", 25) +
      padRight(s.skillMdFound ? "YES" : "NO", 10)
    );
  }

  return result;
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

// ---------------------------------------------------------------------------
// Fallback: Known popular skills for testing
// ---------------------------------------------------------------------------

/**
 * When skills.sh is not scrapable (CSR, requires auth, etc.),
 * we use a set of known popular skills for testing the GitHub
 * SKILL.md fetching pipeline.
 */
async function fetchFallbackSkills(limit: number): Promise<SkillListEntry[]> {
  log("Using fallback skill list for prototype testing...");

  // Known popular skills from skills.sh leaderboard (as of 2025)
  // Correct URL pattern: /{owner}/{repo}/{skillId}
  const knownSkills: SkillListEntry[] = [
    {
      name: "find-skills",
      owner: "vercel-labs",
      repo: "skills",
      skillId: "find-skills",
      skillsShUrl: "https://skills.sh/vercel-labs/skills/find-skills",
      installs: 162200,
    },
    {
      name: "frontend-design",
      owner: "anthropics",
      repo: "skills",
      skillId: "frontend-design",
      skillsShUrl: "https://skills.sh/anthropics/skills/frontend-design",
      installs: 53300,
    },
    {
      name: "skill-creator",
      owner: "anthropics",
      repo: "skills",
      skillId: "skill-creator",
      skillsShUrl: "https://skills.sh/anthropics/skills/skill-creator",
      installs: 26500,
    },
    {
      name: "brainstorming",
      owner: "obra",
      repo: "superpowers",
      skillId: "brainstorming",
      skillsShUrl: "https://skills.sh/obra/superpowers/brainstorming",
      installs: 13700,
    },
    {
      name: "pdf",
      owner: "anthropics",
      repo: "skills",
      skillId: "pdf",
      skillsShUrl: "https://skills.sh/anthropics/skills/pdf",
      installs: 11300,
    },
    {
      name: "systematic-debugging",
      owner: "obra",
      repo: "superpowers",
      skillId: "systematic-debugging",
      skillsShUrl: "https://skills.sh/obra/superpowers/systematic-debugging",
      installs: 7600,
    },
    {
      name: "mcp-builder",
      owner: "anthropics",
      repo: "skills",
      skillId: "mcp-builder",
      skillsShUrl: "https://skills.sh/anthropics/skills/mcp-builder",
      installs: 7100,
    },
    {
      name: "writing-plans",
      owner: "obra",
      repo: "superpowers",
      skillId: "writing-plans",
      skillsShUrl: "https://skills.sh/obra/superpowers/writing-plans",
      installs: 6600,
    },
    {
      name: "test-driven-development",
      owner: "obra",
      repo: "superpowers",
      skillId: "test-driven-development",
      skillsShUrl: "https://skills.sh/obra/superpowers/test-driven-development",
      installs: 6600,
    },
    {
      name: "webapp-testing",
      owner: "anthropics",
      repo: "skills",
      skillId: "webapp-testing",
      skillsShUrl: "https://skills.sh/anthropics/skills/webapp-testing",
      installs: 7700,
    },
    {
      name: "executing-plans",
      owner: "obra",
      repo: "superpowers",
      skillId: "executing-plans",
      skillsShUrl: "https://skills.sh/obra/superpowers/executing-plans",
      installs: 5900,
    },
    {
      name: "requesting-code-review",
      owner: "obra",
      repo: "superpowers",
      skillId: "requesting-code-review",
      skillsShUrl: "https://skills.sh/obra/superpowers/requesting-code-review",
      installs: 5300,
    },
    {
      name: "using-superpowers",
      owner: "obra",
      repo: "superpowers",
      skillId: "using-superpowers",
      skillsShUrl: "https://skills.sh/obra/superpowers/using-superpowers",
      installs: 4800,
    },
    {
      name: "verification-before-completion",
      owner: "obra",
      repo: "superpowers",
      skillId: "verification-before-completion",
      skillsShUrl: "https://skills.sh/obra/superpowers/verification-before-completion",
      installs: 4800,
    },
    {
      name: "using-git-worktrees",
      owner: "obra",
      repo: "superpowers",
      skillId: "using-git-worktrees",
      skillsShUrl: "https://skills.sh/obra/superpowers/using-git-worktrees",
      installs: 4700,
    },
  ];

  // Also try to discover skills via GitHub search API (SKILL.md files)
  try {
    const ghSearchSkills = await discoverViaGitHub(limit);
    if (ghSearchSkills.length > 0) {
      log(`Discovered ${ghSearchSkills.length} additional skills via GitHub search`);

      // Merge, preferring GitHub-discovered ones (they are verified to exist)
      const seen = new Set(knownSkills.map((s) => `${s.owner}/${s.repo}/${s.skillId}`));
      for (const s of ghSearchSkills) {
        const key = `${s.owner}/${s.repo}/${s.skillId}`;
        if (!seen.has(key)) {
          knownSkills.push(s);
          seen.add(key);
        }
      }
    }
  } catch {
    log("GitHub search fallback failed", "warn");
  }

  return knownSkills.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Fallback: GitHub Code Search for SKILL.md files
// ---------------------------------------------------------------------------

async function discoverViaGitHub(limit: number): Promise<SkillListEntry[]> {
  log("Attempting GitHub code search for SKILL.md files...");

  const skills: SkillListEntry[] = [];

  try {
    // GitHub code search API (unauthenticated, limited but works)
    const searchUrl = `https://api.github.com/search/code?q=filename:SKILL.md+path:/&per_page=${Math.min(limit, 30)}`;

    const response = await fetchWithTimeout(searchUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": CONFIG.userAgent,
      },
    });

    if (response.ok) {
      const data = (await response.json()) as {
        items?: Array<{
          name: string;
          path: string;
          repository: {
            full_name: string;
            owner: { login: string };
            name: string;
            description?: string;
          };
          html_url: string;
        }>;
        total_count?: number;
      };

      log(`GitHub search returned ${data.total_count || 0} results`);

      if (data.items) {
        for (const item of data.items) {
          const owner = item.repository.owner.login;
          const repo = item.repository.name;

          // Derive skill name from path or repo name
          const pathParts = item.path.split("/");
          const skillName =
            pathParts.length > 1
              ? pathParts[pathParts.length - 2] // Parent directory name
              : repo;

          skills.push({
            name: skillName,
            owner,
            repo,
            skillId: skillName,
            skillsShUrl: `https://skills.sh/${owner}/${repo}/${skillName}`,
            listingDescription: item.repository.description || undefined,
          });
        }
      }

      // Save GitHub search results for debugging
      const debugPath = resolve(CONFIG.outputDir, "debug-github-search.json");
      writeFileSync(debugPath, JSON.stringify(data, null, 2), "utf-8");
    } else if (response.status === 403) {
      log("GitHub API rate limit reached (unauthenticated)", "warn");
    } else {
      log(`GitHub search returned ${response.status}`, "warn");
    }
  } catch (error) {
    log(
      `GitHub search failed: ${error instanceof Error ? error.message : String(error)}`,
      "warn"
    );
  }

  return skills;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs();

  try {
    const result = await crawl(args);

    if (result.skills.length > 0) {
      log("\nSample skill data:");
      const sample = result.skills[0];
      log(JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (error) {
    log(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
      "error"
    );

    if (error instanceof Error && error.stack) {
      log(error.stack, "error");
    }

    process.exit(1);
  }
}

main();
