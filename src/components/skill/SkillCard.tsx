'use client';

import { Badge } from '@woosgem-dev/react';
import Link from 'next/link';

export interface SkillCardProps {
  id: string;
  name: string;
  description: string;
  authorUsername: string;
  icon?: string;
  tags: string[];
  qualityScore: {
    totalScore: number;
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
  };
  minModel?: string;
  baseTokens?: number;
  installCount?: number;
  onCompareToggle?: (id: string, selected: boolean) => void;
  isCompareSelected?: boolean;
}

const gradeConfig = {
  S: { label: '⭐ Premium', color: 'warning' as const, bg: 'bg-yellow-50' },
  A: { label: '✅ Verified', color: 'success' as const, bg: 'bg-green-50' },
  B: { label: '📋 Standard', color: 'primary' as const, bg: 'bg-blue-50' },
  C: { label: '⚠️ Basic', color: 'secondary' as const, bg: 'bg-gray-50' },
  D: { label: '❌ Incomplete', color: 'danger' as const, bg: 'bg-red-50' },
};

function estimateCost(tokens?: number): string {
  if (!tokens) return '-';
  const cost = (tokens / 1_000_000) * 18; // rough estimate
  if (cost < 0.01) return '< $0.01';
  return `~$${cost.toFixed(2)}`;
}

export function SkillCard({
  id,
  name,
  description,
  authorUsername,
  icon = '📦',
  tags,
  qualityScore,
  minModel,
  baseTokens,
  installCount,
  onCompareToggle,
  isCompareSelected = false,
}: SkillCardProps) {
  const grade = gradeConfig[qualityScore.grade];

  return (
    <div
      className={`
        rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md
        ${isCompareSelected ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <Link
              href={`/skills/${authorUsername}/${name}`}
              className="font-semibold text-gray-900 hover:text-blue-600"
            >
              {name}
            </Link>
            <p className="text-xs text-gray-500">by {authorUsername}</p>
          </div>
        </div>
        <Badge variant="solid" color={grade.color} size="sm">
          {qualityScore.grade}
        </Badge>
      </div>

      {/* Description */}
      <p className="mb-3 line-clamp-2 text-sm text-gray-600">{description}</p>

      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1">
        {tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="subtle" color="secondary" size="sm">
            {tag}
          </Badge>
        ))}
        {tags.length > 3 && (
          <Badge variant="subtle" color="secondary" size="sm">
            +{tags.length - 3}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
        <span title="최소 모델">🤖 {minModel || '-'}</span>
        <span title="예상 비용">💰 {estimateCost(baseTokens)}</span>
        {installCount !== undefined && (
          <span title="설치 수">⬇️ {installCount.toLocaleString()}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/skills/${authorUsername}/${name}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          상세보기 →
        </Link>
        {onCompareToggle && (
          <label className="flex cursor-pointer items-center gap-1 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={isCompareSelected}
              onChange={(e) => onCompareToggle(id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            비교
          </label>
        )}
      </div>
    </div>
  );
}

export default SkillCard;
