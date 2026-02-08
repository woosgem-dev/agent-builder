import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeUrlSchema } from '@/lib/validations/recommend';
import {
  parseGitHubUrl,
  fetchAndParseFrontmatter,
  calculateQualityScore,
  estimateTokenCost,
} from '@/lib/quality-score';

/**
 * POST /api/analyze/url
 * Fetch skill from GitHub URL and analyze
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = AnalyzeUrlSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'GitHub URL 형식이 올바르지 않습니다',
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

    // Fetch and parse frontmatter from GitHub
    const parseResult = await fetchAndParseFrontmatter(owner!, repo!, path!, ref);
    if (!parseResult.success || !parseResult.frontmatter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GITHUB_ERROR',
            message: parseResult.error || 'GitHub에서 파일을 가져올 수 없습니다',
            line: parseResult.errorLine,
          },
        },
        { status: 502 }
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
        source: {
          owner,
          repo,
          path,
          ref,
        },
        scores: analysis.scores,
        improvementTips: analysis.improvementTips,
        analysisComment: analysis.analysisComment,
        estimatedCost,
        parsedFrontmatter: parseResult.frontmatter,
      },
    });
  } catch (error) {
    console.error('Analyze URL error:', error);
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
