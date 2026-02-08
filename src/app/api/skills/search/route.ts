import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SkillStatus } from '@prisma/client';

/**
 * GET /api/skills/search
 * Quick search for command palette (⌘K)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          items: [],
        },
      });
    }

    // Limit search results for quick palette
    const skills = await prisma.skill.findMany({
      where: {
        status: SkillStatus.ACTIVE,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          {
            tags: {
              some: {
                tag: {
                  name: { contains: q, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      },
      take: 10,
      orderBy: [
        { qualityScore: { totalScore: 'desc' } },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        author: {
          select: {
            username: true,
          },
        },
        qualityScore: {
          select: {
            grade: true,
          },
        },
        tags: {
          take: 3,
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const items = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description.slice(0, 100) + (skill.description.length > 100 ? '...' : ''),
      icon: skill.icon,
      author: skill.author.username,
      grade: skill.qualityScore?.grade,
      tags: skill.tags.map((t) => t.tag.name),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        query: q,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '검색 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
