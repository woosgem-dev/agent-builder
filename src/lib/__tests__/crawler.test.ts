import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  parseFrontmatter,
  parseSkillLinks,
  fetchSkillFrontmatter,
  crawlSkillsShPage,
  crawlAndFetchAll,
} from '../crawler';
import type { RawSkillListing } from '@/types/skill';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ---------------------------------------------------------------------------
// Pure function tests (no mocking)
// ---------------------------------------------------------------------------

describe('parseFrontmatter', () => {
  it('parses valid YAML frontmatter', () => {
    const content = `---
name: my-skill
description: A test skill
tags:
  - testing
  - vitest
---

# My Skill

Some body content here.`;

    const result = parseFrontmatter(content);
    expect(result).toEqual({
      name: 'my-skill',
      description: 'A test skill',
      tags: ['testing', 'vitest'],
    });
  });

  it('returns null for content without frontmatter', () => {
    const content = '# Just a heading\n\nSome text.';
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('returns null for invalid YAML', () => {
    const content = '---\n: invalid: yaml: {{\n---';
    expect(parseFrontmatter(content)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseFrontmatter('')).toBeNull();
  });

  it('returns null when frontmatter parses to non-object', () => {
    const content = '---\njust a string\n---';
    expect(parseFrontmatter(content)).toBeNull();
  });
});

describe('parseSkillLinks', () => {
  it('parses 3-part path (owner/repo/skillId)', () => {
    const links = [{ href: '/obra/superpowers/brainstorming', text: 'Brainstorming 13.7K' }];
    const result = parseSkillLinks(links);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      owner: 'obra',
      repo: 'superpowers',
      skillId: 'brainstorming',
      installs: 13700,
    });
  });

  it('parses 2-part path (owner/repo)', () => {
    const links = [{ href: '/anthropics/skills', text: 'Skills' }];
    const result = parseSkillLinks(links);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      owner: 'anthropics',
      repo: 'skills',
      skillId: 'skills',
    });
  });

  it('parses install count from "162.2K" format', () => {
    const links = [{ href: '/vercel-labs/skills/find-skills', text: 'Find Skills 162.2K' }];
    const result = parseSkillLinks(links);
    expect(result[0].installs).toBe(162200);
  });

  it('defaults installs to 0 when not present', () => {
    const links = [{ href: '/owner/repo/skill', text: 'My Skill' }];
    const result = parseSkillLinks(links);
    expect(result[0].installs).toBe(0);
  });

  it('ignores links with fewer than 2 parts', () => {
    const links = [{ href: '/single', text: 'Single' }];
    const result = parseSkillLinks(links);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// HTTP mocking tests (msw)
// ---------------------------------------------------------------------------

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchSkillFrontmatter', () => {
  const mockSkill: RawSkillListing = {
    name: 'test-skill',
    owner: 'test-owner',
    repo: 'test-repo',
    skillId: 'test-skill',
    url: 'https://skills.sh/test-owner/test-repo/test-skill',
    installs: 0,
  };

  it('returns frontmatter when SKILL.md has valid frontmatter', async () => {
    server.use(
      http.get('https://raw.githubusercontent.com/test-owner/test-repo/main/skills/test-skill/SKILL.md', () => {
        return HttpResponse.text(`---
name: test-skill
description: A test
---
# Body`);
      }),
    );

    const result = await fetchSkillFrontmatter(mockSkill);
    expect(result).not.toBeNull();
    expect(result!.frontmatter).toMatchObject({ name: 'test-skill' });
  });

  it('returns null when all paths return 404', async () => {
    server.use(
      http.get('https://raw.githubusercontent.com/*', () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const result = await fetchSkillFrontmatter(mockSkill);
    expect(result).toBeNull();
  });

  // Bug #3: 200 OK with no frontmatter should continue searching
  it('continues searching when 200 OK but no frontmatter', async () => {
    server.use(
      http.get('https://raw.githubusercontent.com/test-owner/test-repo/main/skills/test-skill/SKILL.md', () => {
        return HttpResponse.text('# Just a README with no frontmatter');
      }),
      http.get('https://raw.githubusercontent.com/test-owner/test-repo/main/test-skill/SKILL.md', () => {
        return HttpResponse.text(`---
name: found-skill
description: Found it
---
# Real SKILL.md`);
      }),
      http.get('https://raw.githubusercontent.com/*', () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const result = await fetchSkillFrontmatter(mockSkill);

    expect(result).not.toBeNull();
    expect(result!.frontmatter?.name).toBe('found-skill');
  });
});

// ---------------------------------------------------------------------------
// crawlSkillsShPage tests
// ---------------------------------------------------------------------------

describe('crawlSkillsShPage', () => {
  it('extracts skill links from HTML', async () => {
    server.use(
      http.get('https://skills.sh', () => {
        return HttpResponse.html(`
          <html><body>
            <a href="/obra/superpowers/brainstorming">Brainstorming 13.7K</a>
            <a href="/anthropics/skills/frontend-design">Frontend Design 53.3K</a>
          </body></html>
        `);
      }),
    );

    const result = await crawlSkillsShPage({ limit: 10 });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toMatchObject({ owner: 'obra', repo: 'superpowers' });
  });

  it('deduplicates by owner/repo/skillId', async () => {
    server.use(
      http.get('https://skills.sh', () => {
        return HttpResponse.html(`
          <html><body>
            <a href="/owner/repo/skill">Skill</a>
            <a href="/owner/repo/skill">Skill Duplicate</a>
          </body></html>
        `);
      }),
    );

    const result = await crawlSkillsShPage({ limit: 10 });
    expect(result).toHaveLength(1);
  });

  it('applies offset and limit', async () => {
    server.use(
      http.get('https://skills.sh', () => {
        return HttpResponse.html(`
          <html><body>
            <a href="/a/b/skill1">S1</a>
            <a href="/a/b/skill2">S2</a>
            <a href="/a/b/skill3">S3</a>
          </body></html>
        `);
      }),
    );

    const result = await crawlSkillsShPage({ limit: 1, offset: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].skillId).toBe('skill2');
  });

  it('throws on skills.sh failure', async () => {
    server.use(
      http.get('https://skills.sh', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(crawlSkillsShPage()).rejects.toThrow('Failed to fetch skills.sh');
  });

  it('falls back to known skills when no links found', async () => {
    server.use(
      http.get('https://skills.sh', () => {
        return HttpResponse.html('<html><body>No links here</body></html>');
      }),
      http.get('https://skills.sh/*', () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    const result = await crawlSkillsShPage({ limit: 50 });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((s) => s.owner === 'vercel-labs')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// crawlAndFetchAll tests (Bug #2: burst requests)
// ---------------------------------------------------------------------------

describe('crawlAndFetchAll', () => {
  it('adds delay between inner fetch attempts to prevent burst', async () => {
    const requestTimestamps: number[] = [];

    server.use(
      http.get('https://skills.sh', () => {
        return HttpResponse.html(`
          <html><body>
            <a href="/owner/repo/multi-skill">MS</a>
          </body></html>
        `);
      }),
      http.get('https://raw.githubusercontent.com/*', () => {
        requestTimestamps.push(Date.now());
        return new HttpResponse(null, { status: 404 });
      }),
    );

    await crawlAndFetchAll({ limit: 1 });

    // With multiple inner attempts, there should be some spacing
    if (requestTimestamps.length > 2) {
      const totalDuration = requestTimestamps[requestTimestamps.length - 1] - requestTimestamps[0];
      // With inner delay, total should be > (attempts - 1) * delay
      // Without fix, all requests fire nearly simultaneously (< 100ms total)
      expect(totalDuration).toBeGreaterThan(100);
    }
  });
});
