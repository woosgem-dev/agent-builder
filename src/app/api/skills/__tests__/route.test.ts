import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    skillIndex: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '../route';
import { prisma } from '@/lib/prisma';

const mockCount = vi.mocked(prisma.skillIndex.count);
const mockFindMany = vi.mocked(prisma.skillIndex.findMany);

beforeEach(() => {
  mockCount.mockReset();
  mockFindMany.mockReset();
});

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/skills');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/skills', () => {
  it('returns search results', async () => {
    mockCount.mockResolvedValueOnce(1);
    mockFindMany.mockResolvedValueOnce([
      {
        id: '1',
        name: 'test',
        description: 'A test skill',
        owner: 'owner',
        repo: 'repo',
        skillId: 'test',
        url: 'https://skills.sh/owner/repo/test',
        githubUrl: 'https://github.com/owner/repo',
        tags: '["testing"]',
        installs: 100,
        syncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);

    const response = await GET(makeRequest({ q: 'test' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.skills).toHaveLength(1);
    expect(body.skills[0].tags).toEqual(['testing']);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
  });

  it('returns 400 when q is missing', async () => {
    const response = await GET(makeRequest({}));
    expect(response.status).toBe(400);
  });

  // Bug #5: Empty DB should not return totalPages: 0
  it('returns totalPages >= 1 when database is empty', async () => {
    mockCount.mockResolvedValueOnce(0);
    mockFindMany.mockResolvedValueOnce([] as never);

    const response = await GET(makeRequest({ q: 'anything' }));
    const body = await response.json();

    expect(body.total).toBe(0);
    expect(body.skills).toHaveLength(0);
    expect(body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('returns 500 on Prisma error', async () => {
    mockCount.mockRejectedValueOnce(new Error('DB error'));

    const response = await GET(makeRequest({ q: 'test' }));
    expect(response.status).toBe(500);
  });
});
