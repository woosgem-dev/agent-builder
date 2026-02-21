import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CrawledSkill } from '@/types/skill';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    skillIndex: {
      upsert: vi.fn(),
    },
  },
}));

import { syncSkillsToDb } from '../skill-sync';
import { prisma } from '../prisma';

const mockUpsert = vi.mocked(prisma.skillIndex.upsert);

beforeEach(() => {
  mockUpsert.mockReset();
});

function makeCrawledSkill(overrides: Partial<CrawledSkill> = {}): CrawledSkill {
  return {
    listing: {
      name: 'test-skill',
      owner: 'test-owner',
      repo: 'test-repo',
      skillId: 'test-skill',
      url: 'https://skills.sh/test-owner/test-repo/test-skill',
      installs: 100,
    },
    frontmatter: { name: 'Test Skill', description: 'A test', tags: ['test'] },
    skillMdFound: true,
    ...overrides,
  };
}

describe('syncSkillsToDb', () => {
  it('upserts skill with frontmatter data', async () => {
    mockUpsert.mockResolvedValueOnce({} as never);

    const result = await syncSkillsToDb([makeCrawledSkill()]);

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.total).toBe(1);
    expect(mockUpsert).toHaveBeenCalledOnce();

    const call = mockUpsert.mock.calls[0][0];
    expect(call.where.owner_repo_skillId).toEqual({
      owner: 'test-owner',
      repo: 'test-repo',
      skillId: 'test-skill',
    });
    expect(call.create.name).toBe('Test Skill');
    expect(call.create.description).toBe('A test');
  });

  it('falls back to listing data when frontmatter is null', async () => {
    mockUpsert.mockResolvedValueOnce({} as never);

    const result = await syncSkillsToDb([
      makeCrawledSkill({ frontmatter: null, skillMdFound: false }),
    ]);

    expect(result.synced).toBe(1);
    const call = mockUpsert.mock.calls[0][0];
    expect(call.create.name).toBe('test-skill');
    expect(call.create.description).toBe('');
  });

  it('records errors when Prisma throws', async () => {
    mockUpsert.mockRejectedValueOnce(new Error('SQLITE_BUSY'));

    const result = await syncSkillsToDb([makeCrawledSkill()]);

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('SQLITE_BUSY');
  });

  it('counts synced and failed accurately for mixed results', async () => {
    mockUpsert
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({} as never);

    const skills = [makeCrawledSkill(), makeCrawledSkill(), makeCrawledSkill()];
    const result = await syncSkillsToDb(skills);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.total).toBe(3);
  });
});
