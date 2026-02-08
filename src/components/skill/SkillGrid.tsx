'use client';

import { SkillCard, type SkillCardProps } from './SkillCard';

interface SkillGridProps {
  skills: Omit<SkillCardProps, 'onCompareToggle' | 'isCompareSelected'>[];
  compareIds?: string[];
  onCompareToggle?: (id: string, selected: boolean) => void;
  emptyMessage?: string;
}

export function SkillGrid({
  skills,
  compareIds = [],
  onCompareToggle,
  emptyMessage = '스킬이 없습니다.',
}: SkillGridProps) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-2 text-4xl">🔍</span>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard
          key={skill.id}
          {...skill}
          onCompareToggle={onCompareToggle}
          isCompareSelected={compareIds.includes(skill.id)}
        />
      ))}
    </div>
  );
}

export default SkillGrid;
