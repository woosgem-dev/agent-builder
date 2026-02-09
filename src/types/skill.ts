/**
 * Skill data from the SkillIndex database
 */
export interface Skill {
  id: string;
  name: string;
  description: string;
  owner: string;
  repo: string;
  skillId: string;
  url: string;
  githubUrl: string;
  tags: string[];
  installs: number;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Raw skill data from skills.sh crawling (HTML parsing result)
 */
export interface RawSkillListing {
  /** Skill name as displayed on skills.sh */
  name: string;
  /** GitHub owner (user/org) */
  owner: string;
  /** GitHub repository name */
  repo: string;
  /** Skill identifier within the repo */
  skillId: string;
  /** Full skills.sh URL */
  url: string;
  /** Install count if available */
  installs: number;
  /** Short description from skills.sh listing */
  listingDescription?: string;
}

/**
 * Parsed SKILL.md frontmatter data
 */
export interface SkillFrontmatter {
  name?: string;
  description?: string;
  tags?: string[];
  'allowed-tools'?: string[];
  [key: string]: unknown;
}

/**
 * Result of fetching SKILL.md from GitHub
 */
export interface SkillMdResult {
  frontmatter: SkillFrontmatter | null;
  branch: string;
  path: string;
}

/**
 * Fully crawled skill data (listing + frontmatter combined)
 */
export interface CrawledSkill {
  /** Data from skills.sh listing */
  listing: RawSkillListing;
  /** SKILL.md frontmatter (null if not found) */
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

/**
 * Options for the crawl operation
 */
export interface CrawlOptions {
  /** Maximum number of skills to crawl */
  limit?: number;
  /** Number of skills to skip from the beginning */
  offset?: number;
}

/**
 * Result of the sync operation (DB upsert)
 */
export interface SyncResult {
  synced: number;
  failed: number;
  total: number;
  errors: string[];
  message: string;
}
