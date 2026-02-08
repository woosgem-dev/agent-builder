import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeFrontmatterSchema } from '@/lib/validations/recommend';
import {
  parseFrontmatter,
  calculateQualityScore,
  estimateTokenCost,
} from '@/lib/quality-score';

/**
 * POST /api/analyze
 * Analyze frontmatter content and return quality score
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = AnalyzeFrontmatterSchema.safeParse(body);
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

    const { frontmatter: rawFrontmatter } = validation.data;

    // Parse frontmatter
    const parseResult = parseFrontmatter(`---\n${rawFrontmatter}\n---`);
    if (!parseResult.success || !parseResult.frontmatter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: parseResult.error || 'Frontmatter 파싱 실패',
            line: parseResult.errorLine,
          },
        },
        { status: 400 }
      );
    }

    // Calculate quality score
    const analysis = calculateQualityScore(parseResult.frontmatter);

    // Estimate cost if base_tokens available
    const baseTokens = parseResult.frontmatter.skillhub?.resources?.base_tokens;
    const estimatedCost = baseTokens ? estimateTokenCost(baseTokens) : null;

    return NextResponse.json({
      success: true,
      data: {
        scores: analysis.scores,
        improvementTips: analysis.improvementTips,
        analysisComment: analysis.analysisComment,
        estimatedCost,
        parsedFrontmatter: parseResult.frontmatter,
      },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '분석 중 오류가 발생했습니다',
        },
      },
      { status: 500 }
    );
  }
}
