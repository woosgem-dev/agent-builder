import { NextRequest, NextResponse } from 'next/server';
import { crawlAndFetchAll } from '@/lib/crawler';
import { syncSkillsToDb } from '@/lib/skill-sync';
import type { SyncResult } from '@/types/skill';

/**
 * POST /api/skills/sync
 * Trigger crawling pipeline: skills.sh -> GitHub SKILL.md -> DB upsert
 *
 * Request body (optional):
 *   { "limit": number, "offset": number }
 *
 * Response:
 *   { synced, failed, total, errors, message }
 */
export async function POST(request: NextRequest): Promise<NextResponse<SyncResult>> {
  try {
    // 1. Parse options from request body (all optional)
    let limit: number | undefined;
    let offset: number | undefined;

    try {
      const body = await request.json();
      if (typeof body.limit === 'number') limit = body.limit;
      if (typeof body.offset === 'number') offset = body.offset;
    } catch {
      // No body or invalid JSON - use defaults
    }

    // 2. Crawl skills.sh and fetch SKILL.md frontmatter
    const crawledSkills = await crawlAndFetchAll({ limit, offset });

    if (crawledSkills.length === 0) {
      return NextResponse.json({
        synced: 0,
        failed: 0,
        total: 0,
        errors: [],
        message: 'No skills found to sync. The skills.sh site may be unavailable.',
      });
    }

    // 3. Upsert into database
    const result = await syncSkillsToDb(crawledSkills);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        synced: 0,
        failed: 0,
        total: 0,
        errors: [message],
        message: `Sync failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
