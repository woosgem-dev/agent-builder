'use client';

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  showValue?: boolean;
}

function getColorClass(percentage: number): string {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 70) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function ScoreBar({ label, score, maxScore, showValue = true }: ScoreBarProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const colorClass = getColorClass(percentage);

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        {showValue && (
          <span className="font-medium text-gray-900">
            {score}/{maxScore}
          </span>
        )}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={maxScore}
        aria-label={`${label}: ${score}/${maxScore}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface QualityScoreCardProps {
  scores: {
    coreFieldScore: number;
    descriptionScore: number;
    runtimeScore: number;
    resourcesScore: number;
    useCasesScore: number;
    dependenciesScore: number;
    totalScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
  };
  improvementTips?: Array<{ field: string; tip: string }>;
  showDetails?: boolean;
}

const gradeLabels = {
  S: { emoji: '⭐', label: 'Premium', color: 'text-yellow-600' },
  A: { emoji: '✅', label: 'Verified', color: 'text-green-600' },
  B: { emoji: '📋', label: 'Standard', color: 'text-blue-600' },
  C: { emoji: '⚠️', label: 'Basic', color: 'text-gray-600' },
  D: { emoji: '❌', label: 'Incomplete', color: 'text-red-600' },
};

export function QualityScoreCard({
  scores,
  improvementTips,
  showDetails = true,
}: QualityScoreCardProps) {
  const grade = gradeLabels[scores.grade];

  return (
    <div className="rounded-lg border bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">📊 AI 품질 분석</h3>
        <div className={`text-lg font-bold ${grade.color}`}>
          {grade.emoji} {scores.grade}등급
        </div>
      </div>

      {/* Total Score */}
      <div className="mb-4 text-center">
        <div className="text-4xl font-bold text-gray-900">{scores.totalScore}</div>
        <div className="text-sm text-gray-500">/ 100점</div>
      </div>

      {/* Breakdown */}
      {showDetails && (
        <div className="mb-4">
          <ScoreBar label="Core 필드" score={scores.coreFieldScore} maxScore={25} />
          <ScoreBar label="Description" score={scores.descriptionScore} maxScore={20} />
          <ScoreBar label="Runtime" score={scores.runtimeScore} maxScore={15} />
          <ScoreBar label="Resources" score={scores.resourcesScore} maxScore={15} />
          <ScoreBar label="Use Cases" score={scores.useCasesScore} maxScore={15} />
          <ScoreBar label="Dependencies" score={scores.dependenciesScore} maxScore={10} />
        </div>
      )}

      {/* Improvement Tips */}
      {improvementTips && improvementTips.length > 0 && (
        <div className="rounded-md bg-blue-50 p-3">
          <p className="mb-2 text-sm font-medium text-blue-800">💡 점수 개선 팁</p>
          <ul className="space-y-1 text-sm text-blue-700">
            {improvementTips.slice(0, 3).map((tip, idx) => (
              <li key={idx}>• {tip.tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ScoreBar;
