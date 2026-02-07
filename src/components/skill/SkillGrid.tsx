import { SkillCard } from './SkillCard';

// 임시 더미 데이터
const dummySkills = [
  {
    id: '1',
    name: 'PRD Writer',
    description: 'PRD 작성을 도와주는 스킬입니다. 새 기능 기획서, 요구사항 정리 등에 활용할 수 있습니다.',
    icon: '📝',
    rating: 4.8,
    tags: ['기획', 'PRD', '문서화'],
    author: 'woosgem',
  },
  {
    id: '2',
    name: 'Figma Helper',
    description: 'Figma 작업을 자동화해주는 스킬입니다.',
    icon: '🎨',
    rating: 4.6,
    tags: ['디자인', 'Figma', '자동화'],
    author: 'designer',
  },
  {
    id: '3',
    name: 'Test Gen',
    description: '테스트 케이스를 자동으로 생성해주는 스킬입니다.',
    icon: '🧪',
    rating: 4.5,
    tags: ['QA', '테스트', '자동화'],
    author: 'tester',
  },
  {
    id: '4',
    name: 'Code Review',
    description: '코드 리뷰를 도와주는 스킬입니다. PR 분석, 개선점 제안 등.',
    icon: '⚙️',
    rating: 4.7,
    tags: ['개발', '리뷰', '코드'],
    author: 'developer',
  },
];

interface SkillGridProps {
  type?: 'popular' | 'latest';
}

export function SkillGrid({ type = 'popular' }: SkillGridProps) {
  // TODO: 실제 API 호출로 대체
  const skills = dummySkills;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {skills.map((skill) => (
        <SkillCard key={skill.id} {...skill} />
      ))}
    </div>
  );
}
