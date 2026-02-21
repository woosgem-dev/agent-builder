import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/crawler', () => ({
  crawlAndFetchAll: vi.fn(),
}));

vi.mock('@/lib/skill-sync', () => ({
  syncSkillsToDb: vi.fn(),
}));

import { POST } from '../route';
import { crawlAndFetchAll } from '@/lib/crawler';
import { syncSkillsToDb } from '@/lib/skill-sync';

const mockCrawl = vi.mocked(crawlAndFetchAll);
const mockSync = vi.mocked(syncSkillsToDb);

function makeRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest('http://localhost/api/skills/sync', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockCrawl.mockReset();
  mockSync.mockReset();
});

describe('POST /api/skills/sync', () => {
  it('runs crawl and sync pipeline', async () => {
    mockCrawl.mockResolvedValueOnce([
      {
        listing: { name: 's', owner: 'o', repo: 'r', skillId: 's', url: '', installs: 0 },
        frontmatter: null,
        skillMdFound: false,
      },
    ]);
    mockSync.mockResolvedValueOnce({
      synced: 1,
      failed: 0,
      total: 1,
      errors: [],
      message: 'ok',
    });

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.synced).toBe(1);
  });

  it('returns message when no skills found', async () => {
    mockCrawl.mockResolvedValueOnce([]);

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(body.total).toBe(0);
    expect(body.message).toContain('No skills found');
  });

  it('returns 500 on crawl error', async () => {
    mockCrawl.mockRejectedValueOnce(new Error('Network error'));

    const response = await POST(makeRequest());
    expect(response.status).toBe(500);
  });

  // Bug #1: Concurrent requests should be rejected
  it('rejects concurrent sync requests with 409', async () => {
    mockCrawl.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
    );

    const req1 = POST(makeRequest());
    const req2 = POST(makeRequest());

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });
});
