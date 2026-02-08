import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CreateSkillSchema, SkillQuerySchema } from '@/lib/validations/skill';
import {
  parseGitHubUrl,
  fetchAndParseFrontmatter,
  calculateQualityScore,
} from '@/lib/quality-score';
import { SkillStatus } from '@prisma/client';

/**
 * GET /api/skills
 * List skills with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const queryResult = SkillQuerySchema.safeParse({
      q: searchParams.get('q') || undefined,
      tags: searchParams.getAll('tags').length > 0 ? searchParams.getAll('tags') : undefined,
      grade: searchParams.get('grade') || undefined,
      model: searchParams.get('model') || undefined,
      author: searchParams.get('author') || undefined,
      sort: searchParams.get('sort') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '쿼리 파라미터가 올바르지 않습니다',
            details: queryResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { q, tags, grade, model, author, sort, page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: SkillStatus.ACTIVE,
      deletedAt: null,
    };

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Tag filter
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    // Grade filter
    if (grade) {
      where.qualityScore = {
        grade,
      };
    }

    // Model filter (min_model)
    if (model) {
      const modelMap: Record<string, string[]> = {
        haiku: ['haiku', 'claude-3-haiku', 'claude-3.5-haiku'],
        sonnet: ['sonnet', 'claude-3-sonnet', 'claude-3.5-sonnet', 'claude-sonnet-4'],
        opus: ['opus', 'claude-3-opus', 'claude-opus-4'],
      };
      where.minModel = { in: modelMap[model] || [] };
    }

    // Author filter
    if (author) {
      where.author = { username: author };
    }

    // Build orderBy
    const orderBy: any[] = [];
    switch (sort) {
      case 'score':
        orderBy.push({ qualityScore: { totalScore: 'desc' } });
        break;
      case 'popular':
        orderBy.push({ installs: { _count: 'desc' } });
        break;
      case 'recent':
      default:
        orderBy.push({ createdAt: 'desc' });
    }

    // Fetch skills with relations
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          qualityScore: {
            select: {
              totalScore: true,
              grade: true,
            },
          },
          _count: {
            select: {
              installs: true,
              bookmarks: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.skill.count({ where }),
    ]);

    // Transform response
    const items = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      icon: skill.icon,
      author: skill.author,
      tags: skill.tags.map((st) => st.tag.name),
      qualityScore: skill.qualityScore,
      stats: skill._count,
      createdAt: skill.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('List skills error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '스킬 목록을 가져오는 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/skills
 * Create a new skill from GitHub URL
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '로그인이 필요합니다',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = CreateSkillSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '입력값이 올바르지 않습니다',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { githubUrl } = validation.data;

    // Parse GitHub URL
    const urlParts = parseGitHubUrl(githubUrl);
    if (!urlParts.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: urlParts.error || 'GitHub URL을 파싱할 수 없습니다',
          },
        },
        { status: 400 }
      );
    }

    const { owner, repo, path, ref } = urlParts;

    // Check for duplicate
    const existing = await prisma.skill.findFirst({
      where: {
        sourceOwner: owner!,
        sourceRepo: repo!,
        sourcePath: path!,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE',
            message: '이미 등록된 스킬입니다',
            existingId: existing.id,
          },
        },
        { status: 409 }
      );
    }

    // Fetch and parse frontmatter from GitHub
    const parseResult = await fetchAndParseFrontmatter(owner!, repo!, path!, ref);
    if (!parseResult.success || !parseResult.frontmatter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: parseResult.error || 'Frontmatter를 파싱할 수 없습니다',
            line: parseResult.errorLine,
          },
        },
        { status: 400 }
      );
    }

    const fm = parseResult.frontmatter;

    // Calculate quality score
    const analysis = calculateQualityScore(fm);

    // Create skill with transaction
    const skill = await prisma.$transaction(async (tx) => {
      // Create skill
      const newSkill = await tx.skill.create({
        data: {
          name: fm.name || path!.split('/').pop()?.replace('.md', '') || 'untitled',
          description: fm.description || '',
          version: fm.version || '1.0.0',
          authorId: session.user!.id,
          sourceType: 'github',
          sourceOwner: owner!,
          sourceRepo: repo!,
          sourcePath: path!,
          sourceRef: ref || 'main',
          minModel: fm.skillhub?.runtime?.min_model,
          baseTokens: fm.skillhub?.resources?.base_tokens,
          contextHint: fm.skillhub?.resources?.context_hint,
          icon: fm.extended?.icon,
          license: fm.extended?.license,
          status: SkillStatus.ACTIVE,
        },
      });

      // Create quality score
      await tx.qualityScore.create({
        data: {
          skillId: newSkill.id,
          ...analysis.scores,
        },
      });

      // Create tags
      if (fm.tags && fm.tags.length > 0) {
        for (const tagName of fm.tags) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          await tx.skillTag.create({
            data: {
              skillId: newSkill.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Create tools
      const tools = fm.skillhub?.runtime?.tools;
      if (tools) {
        const allTools = [
          ...(tools.required || []).map((t) => ({ name: t, required: true })),
          ...(tools.optional || []).map((t) => ({ name: t, required: false })),
        ];
        for (const { name, required } of allTools) {
          const tool = await tx.tool.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          await tx.skillTool.create({
            data: {
              skillId: newSkill.id,
              toolId: tool.id,
              required,
            },
          });
        }
      }

      // Create use cases
      const useCases = fm.extended?.['use-cases'];
      if (useCases && useCases.length > 0) {
        for (const useCase of useCases) {
          await tx.useCase.create({
            data: {
              skillId: newSkill.id,
              content: useCase,
            },
          });
        }
      }

      // Create target roles
      const targetRoles = fm.extended?.['target-roles'];
      if (targetRoles && targetRoles.length > 0) {
        for (const role of targetRoles) {
          await tx.targetRole.create({
            data: {
              skillId: newSkill.id,
              role,
            },
          });
        }
      }

      return newSkill;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: skill.id,
          name: skill.name,
          qualityScore: analysis.scores,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create skill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '스킬 등록 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
