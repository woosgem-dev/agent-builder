import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { skillSearchParamsSchema } from '@/lib/schemas';

export interface SkillSearchResult {
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
}

export interface SkillSearchResponse {
  skills: SkillSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parse the tags JSON string from the database into a string array.
 * Returns an empty array if parsing fails.
 */
function parseTags(tagsJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(tagsJson);
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      return parsed as string[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * GET /api/skills
 * Search skills by query (description, tags, name-based search)
 *
 * Query params:
 *   q     - search query (required, min 1 char)
 *   page  - page number (default 1)
 *   limit - results per page (default 20, max 100)
 *
 * Response: SkillSearchResponse
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Validate query parameters with Zod
  const parseResult = skillSearchParamsSchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });

  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: 'Invalid search parameters', details: errors },
      { status: 400 },
    );
  }

  const { q, page, limit } = parseResult.data;

  try {
    const whereClause = {
      OR: [
        { description: { contains: q } },
        { tags: { contains: q } },
        { name: { contains: q } },
      ],
    };

    // Run count and search queries in parallel for efficiency
    const [total, results] = await Promise.all([
      prisma.skillIndex.count({ where: whereClause }),
      prisma.skillIndex.findMany({
        where: whereClause,
        orderBy: { installs: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const skills: SkillSearchResult[] = results.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      owner: row.owner,
      repo: row.repo,
      skillId: row.skillId,
      url: row.url,
      githubUrl: row.githubUrl,
      tags: parseTags(row.tags),
      installs: row.installs,
    }));

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return NextResponse.json<SkillSearchResponse>({
      skills,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Skill search failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
