import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateSkillSchema } from '@/lib/validations/skill';
import { SkillStatus } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/skills/[id]
 * Get single skill detail
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const skill = await prisma.skill.findFirst({
      where: {
        id,
        deletedAt: null,
      },
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
        tools: {
          include: {
            tool: true,
          },
        },
        useCases: {
          select: {
            id: true,
            content: true,
          },
        },
        targetRoles: {
          select: {
            id: true,
            role: true,
          },
        },
        qualityScore: true,
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
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
    });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '스킬을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    // Transform response
    const response = {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      version: skill.version,
      icon: skill.icon,
      license: skill.license,
      status: skill.status,
      source: {
        type: skill.sourceType,
        owner: skill.sourceOwner,
        repo: skill.sourceRepo,
        path: skill.sourcePath,
        ref: skill.sourceRef,
        url: `https://github.com/${skill.sourceOwner}/${skill.sourceRepo}/blob/${skill.sourceRef}/${skill.sourcePath}`,
      },
      runtime: {
        minModel: skill.minModel,
        tools: {
          required: skill.tools.filter((t) => t.required).map((t) => t.tool.name),
          optional: skill.tools.filter((t) => !t.required).map((t) => t.tool.name),
        },
      },
      resources: {
        baseTokens: skill.baseTokens,
        contextHint: skill.contextHint,
      },
      author: skill.author,
      tags: skill.tags.map((st) => st.tag.name),
      useCases: skill.useCases,
      targetRoles: skill.targetRoles.map((tr) => tr.role),
      qualityScore: skill.qualityScore,
      stats: skill._count,
      reviews: skill.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        author: r.author,
        createdAt: r.createdAt,
      })),
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Get skill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '스킬을 가져오는 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/skills/[id]
 * Update skill (owner only)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
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

    const { id } = await context.params;

    // Check if skill exists and user is owner
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '스킬을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    if (skill.authorId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '스킬 수정 권한이 없습니다',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = UpdateSkillSchema.safeParse(body);
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

    // Update skill
    const updated = await prisma.skill.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        version: updated.version,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '스킬 수정 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/skills/[id]
 * Soft delete skill (owner only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
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

    const { id } = await context.params;

    // Check if skill exists and user is owner
    const skill = await prisma.skill.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!skill) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '스킬을 찾을 수 없습니다',
          },
        },
        { status: 404 }
      );
    }

    if (skill.authorId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '스킬 삭제 권한이 없습니다',
          },
        },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.skill.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: SkillStatus.ARCHIVED,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: '스킬이 삭제되었습니다',
      },
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '스킬 삭제 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
