/**
 * Skill Sync Module
 *
 * Upserts crawled skill data into the SkillIndex database table.
 * Uses Prisma's upsert with the unique constraint [owner, repo, skillId].
 */

import { prisma } from '@/lib/prisma';
import type { CrawledSkill, SyncResult } from '@/types/skill';

/**
 * Sync crawled skills to the database via upsert.
 *
 * For each crawled skill:
 * - If a record with matching [owner, repo, skillId] exists, update it
 * - Otherwise, create a new record
 * - Always updates syncedAt timestamp
 *
 * Skills without a found SKILL.md are still saved with fallback data
 * from the skills.sh listing (name, owner, repo, etc.).
 */
export async function syncSkillsToDb(
  skills: CrawledSkill[],
): Promise<SyncResult> {
  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const skill of skills) {
    const { listing, frontmatter } = skill;

    // Resolve final values: prefer frontmatter over listing data
    const name = frontmatter?.name || listing.name;
    const description =
      frontmatter?.description ||
      listing.listingDescription ||
      '';
    const tags = frontmatter?.tags ?? [];
    const tagsJson = JSON.stringify(tags);

    const githubUrl = `https://github.com/${listing.owner}/${listing.repo}`;

    try {
      const sharedData = {
        name,
        description,
        url: listing.url,
        githubUrl,
        tags: tagsJson,
        installs: listing.installs,
        syncedAt: new Date(),
      };

      await prisma.skillIndex.upsert({
        where: {
          owner_repo_skillId: {
            owner: listing.owner,
            repo: listing.repo,
            skillId: listing.skillId,
          },
        },
        update: sharedData,
        create: {
          ...sharedData,
          owner: listing.owner,
          repo: listing.repo,
          skillId: listing.skillId,
        },
      });

      synced++;
    } catch (error) {
      failed++;
      const message =
        error instanceof Error ? error.message : String(error);
      errors.push(
        `Failed to upsert ${listing.owner}/${listing.repo}/${listing.skillId}: ${message}`,
      );
    }
  }

  return {
    synced,
    failed,
    total: skills.length,
    errors,
    message: `Sync complete: ${synced} synced, ${failed} failed out of ${skills.length} total`,
  };
}
