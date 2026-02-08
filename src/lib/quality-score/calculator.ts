// Grade enum (matches Prisma schema)
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

/**
 * Quality Score Calculator
 * Based on PRD v0.3 scoring criteria
 */

export interface Frontmatter {
  // Layer 1: Core
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  author?: string;

  // Layer 2: SkillHub
  skillhub?: {
    location?: {
      type?: string;
      owner?: string;
      repo?: string;
      path?: string;
      ref?: string;
    };
    runtime?: {
      claude_code?: string;
      min_model?: string;
      tools?: {
        required?: string[];
        optional?: string[];
      };
    };
    resources?: {
      base_tokens?: number;
      context_hint?: string;
    };
    dependencies?: Array<{
      id?: string;
      version?: string;
      optional?: boolean;
    }>;
  };

  // Layer 3: Extended
  extended?: {
    'use-cases'?: string[];
    'target-roles'?: string[];
    icon?: string;
    license?: string;
    status?: string;
  };
}

export interface ScoreBreakdown {
  coreFieldScore: number; // /25
  descriptionScore: number; // /20
  runtimeScore: number; // /15
  resourcesScore: number; // /15
  useCasesScore: number; // /15
  dependenciesScore: number; // /10
  totalScore: number; // /100
  grade: Grade;
}

export interface ImprovementTip {
  field: string;
  currentScore: number;
  maxScore: number;
  tip: string;
}

export interface QualityAnalysis {
  scores: ScoreBreakdown;
  improvementTips: ImprovementTip[];
  analysisComment: string;
}

/**
 * Calculate quality score from frontmatter
 */
export function calculateQualityScore(frontmatter: Frontmatter): QualityAnalysis {
  const scores: ScoreBreakdown = {
    coreFieldScore: calculateCoreFieldScore(frontmatter),
    descriptionScore: calculateDescriptionScore(frontmatter),
    runtimeScore: calculateRuntimeScore(frontmatter),
    resourcesScore: calculateResourcesScore(frontmatter),
    useCasesScore: calculateUseCasesScore(frontmatter),
    dependenciesScore: calculateDependenciesScore(frontmatter),
    totalScore: 0,
    grade: 'D',
  };

  scores.totalScore =
    scores.coreFieldScore +
    scores.descriptionScore +
    scores.runtimeScore +
    scores.resourcesScore +
    scores.useCasesScore +
    scores.dependenciesScore;

  scores.grade = getGrade(scores.totalScore);

  const improvementTips = generateImprovementTips(scores, frontmatter);
  const analysisComment = generateAnalysisComment(scores);

  return {
    scores,
    improvementTips,
    analysisComment,
  };
}

/**
 * Core Field Score (25 points)
 * - name: 5 points
 * - description: 5 points
 * - version: 5 points
 * - tags: 5 points
 * - author: 5 points
 */
function calculateCoreFieldScore(fm: Frontmatter): number {
  let score = 0;

  if (fm.name && fm.name.length > 0) score += 5;
  if (fm.description && fm.description.length > 0) score += 5;
  if (fm.version && /^\d+\.\d+\.\d+$/.test(fm.version)) score += 5;
  if (fm.tags && fm.tags.length > 0) score += 5;
  if (fm.author && fm.author.length > 0) score += 5;

  return score;
}

/**
 * Description Score (20 points)
 * - Length (10 points): 50+ chars = 5, 100+ = 7, 200+ = 10
 * - Quality (10 points): Has problem-solution structure
 */
function calculateDescriptionScore(fm: Frontmatter): number {
  if (!fm.description) return 0;

  let score = 0;
  const desc = fm.description;

  // Length score
  if (desc.length >= 200) score += 10;
  else if (desc.length >= 100) score += 7;
  else if (desc.length >= 50) score += 5;
  else if (desc.length > 0) score += 2;

  // Quality score (problem-solution indicators)
  const problemIndicators = ['문제', '어려움', 'problem', 'issue', 'difficult', 'challenge'];
  const solutionIndicators = ['해결', '도움', 'solve', 'help', 'provide', 'enable', 'automate'];

  const hasProblem = problemIndicators.some((p) => desc.toLowerCase().includes(p));
  const hasSolution = solutionIndicators.some((s) => desc.toLowerCase().includes(s));

  if (hasProblem && hasSolution) score += 10;
  else if (hasProblem || hasSolution) score += 5;

  return Math.min(score, 20);
}

/**
 * Runtime Score (15 points)
 * - min_model defined: 5 points
 * - tools.required defined: 5 points
 * - tools.optional defined: 5 points
 */
function calculateRuntimeScore(fm: Frontmatter): number {
  let score = 0;
  const runtime = fm.skillhub?.runtime;

  if (!runtime) return 0;

  if (runtime.min_model) score += 5;
  if (runtime.tools?.required && runtime.tools.required.length > 0) score += 5;
  if (runtime.tools?.optional && runtime.tools.optional.length > 0) score += 5;

  return score;
}

/**
 * Resources Score (15 points)
 * - base_tokens defined: 8 points
 * - context_hint defined: 7 points
 */
function calculateResourcesScore(fm: Frontmatter): number {
  let score = 0;
  const resources = fm.skillhub?.resources;

  if (!resources) return 0;

  if (resources.base_tokens && resources.base_tokens > 0) score += 8;
  if (resources.context_hint) score += 7;

  return score;
}

/**
 * Use Cases Score (15 points)
 * - 3+ use cases: 15 points
 * - 2 use cases: 10 points
 * - 1 use case: 5 points
 */
function calculateUseCasesScore(fm: Frontmatter): number {
  const useCases = fm.extended?.['use-cases'];

  if (!useCases || useCases.length === 0) return 0;

  if (useCases.length >= 3) return 15;
  if (useCases.length === 2) return 10;
  return 5;
}

/**
 * Dependencies Score (10 points)
 * - If no dependencies needed: 10 points (full score)
 * - Dependencies listed with version: 10 points
 * - Dependencies listed without version: 5 points
 */
function calculateDependenciesScore(fm: Frontmatter): number {
  const deps = fm.skillhub?.dependencies;

  // No dependencies = full score (self-contained is good)
  if (!deps || deps.length === 0) return 10;

  // Check if all dependencies have versions
  const allHaveVersions = deps.every((d) => d.version);
  if (allHaveVersions) return 10;

  // Some dependencies without versions
  return 5;
}

/**
 * Convert score to grade
 */
function getGrade(score: number): Grade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * Generate improvement tips based on scores
 */
function generateImprovementTips(scores: ScoreBreakdown, fm: Frontmatter): ImprovementTip[] {
  const tips: ImprovementTip[] = [];

  // Core fields
  if (scores.coreFieldScore < 25) {
    if (!fm.name) {
      tips.push({
        field: 'name',
        currentScore: 0,
        maxScore: 5,
        tip: 'name 필드를 추가하세요',
      });
    }
    if (!fm.tags || fm.tags.length === 0) {
      tips.push({
        field: 'tags',
        currentScore: 0,
        maxScore: 5,
        tip: 'tags를 최소 1개 이상 추가하세요',
      });
    }
  }

  // Description
  if (scores.descriptionScore < 20) {
    if (!fm.description || fm.description.length < 100) {
      tips.push({
        field: 'description',
        currentScore: scores.descriptionScore,
        maxScore: 20,
        tip: 'description을 100자 이상으로 작성하고, 문제-해결 구조를 포함하세요',
      });
    }
  }

  // Runtime
  if (scores.runtimeScore < 15) {
    if (!fm.skillhub?.runtime?.min_model) {
      tips.push({
        field: 'runtime.min_model',
        currentScore: 0,
        maxScore: 5,
        tip: 'skillhub.runtime.min_model을 추가하면 +5점',
      });
    }
    if (!fm.skillhub?.runtime?.tools?.required) {
      tips.push({
        field: 'runtime.tools.required',
        currentScore: 0,
        maxScore: 5,
        tip: 'skillhub.runtime.tools.required를 추가하면 +5점',
      });
    }
  }

  // Resources
  if (scores.resourcesScore < 15) {
    if (!fm.skillhub?.resources?.base_tokens) {
      tips.push({
        field: 'resources.base_tokens',
        currentScore: 0,
        maxScore: 8,
        tip: 'skillhub.resources.base_tokens를 추가하면 +8점',
      });
    }
    if (!fm.skillhub?.resources?.context_hint) {
      tips.push({
        field: 'resources.context_hint',
        currentScore: 0,
        maxScore: 7,
        tip: 'skillhub.resources.context_hint를 추가하면 +7점',
      });
    }
  }

  // Use cases
  if (scores.useCasesScore < 15) {
    const count = fm.extended?.['use-cases']?.length || 0;
    if (count < 3) {
      tips.push({
        field: 'use-cases',
        currentScore: scores.useCasesScore,
        maxScore: 15,
        tip: `use-cases를 ${3 - count}개 더 추가하면 만점`,
      });
    }
  }

  return tips;
}

/**
 * Generate analysis comment
 */
function generateAnalysisComment(scores: ScoreBreakdown): string {
  const { totalScore, grade } = scores;

  if (grade === 'S') {
    return '우수한 품질의 스킬입니다. 모든 필수 정보가 잘 작성되어 있습니다.';
  }
  if (grade === 'A') {
    return '좋은 품질의 스킬입니다. 몇 가지 개선점을 보완하면 S등급이 가능합니다.';
  }
  if (grade === 'B') {
    return '표준 품질의 스킬입니다. 추가 정보를 보완하면 품질 점수를 높일 수 있습니다.';
  }
  if (grade === 'C') {
    return '기본적인 정보만 포함되어 있습니다. 개선 팁을 참고하여 품질을 높여주세요.';
  }
  return '필수 정보가 부족합니다. 개선 팁을 참고하여 보완해주세요.';
}

/**
 * Estimate token cost based on base_tokens
 * Assumes Claude 3.5 Sonnet pricing (~$3/1M input, ~$15/1M output)
 */
export function estimateTokenCost(baseTokens: number): string {
  // Rough estimate: assume 1:1 input:output ratio
  const inputCost = (baseTokens / 1_000_000) * 3;
  const outputCost = (baseTokens / 1_000_000) * 15;
  const totalCost = inputCost + outputCost;

  if (totalCost < 0.01) return '< $0.01';
  return `~$${totalCost.toFixed(2)}`;
}
