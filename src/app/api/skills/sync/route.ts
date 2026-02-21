import { NextRequest, NextResponse } from 'next/server';
import { crawlAndFetchAll } from '@/lib/crawler';
import { syncSkillsToDb } from '@/lib/skill-sync';
import type { SyncResult } from '@/types/skill';

let syncInProgress = false;

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
export async function POST(request: NextRequest): Promise<NextResponse<SyncResult | { error: string }>> {
  if (syncInProgress) {
    return NextResponse.json(
      { error: 'Sync already in progress' } as { error: string },
      { status: 409 },
    );
  }

  syncInProgress = true;

  try {
    const body = await request.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' ? body.limit : undefined;
    const offset = typeof body.offset === 'number' ? body.offset : undefined;

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
  } finally {
    syncInProgress = false;
  }
}
