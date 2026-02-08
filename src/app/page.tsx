import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkillGrid } from '@/components/skill';
import Link from 'next/link';

// Mock data (will be replaced with API calls)
const mockSkills = [
  {
    id: 'skill_1',
    name: 'code-reviewer',
    description: 'PR과 코드 변경사항을 리뷰하고 개선점을 제안하는 스킬입니다. 코드 품질 문제를 찾아내어 해결책을 제시합니다.',
    authorUsername: 'woosgem',
    icon: '🔍',
    tags: ['review', 'code', 'quality'],
    qualityScore: { totalScore: 95, grade: 'S' as const },
    minModel: 'sonnet',
    baseTokens: 1800,
    installCount: 1234,
  },
  {
    id: 'skill_4',
    name: 'figma-helper',
    description: 'Figma 디자인을 분석하고 코드 컴포넌트로 변환하는 스킬입니다. 디자인 시스템과 일관된 코드를 생성합니다.',
    authorUsername: 'thrall-dev',
    icon: '🎨',
    tags: ['design', 'figma', 'frontend'],
    qualityScore: { totalScore: 92, grade: 'S' as const },
    minModel: 'sonnet',
    baseTokens: 3200,
    installCount: 2341,
  },
  {
    id: 'skill_2',
    name: 'prd-writer',
    description: '제품 요구사항 문서(PRD)를 작성하는 스킬입니다. 사용자 스토리, 기능 명세, 수용 기준을 체계적으로 정리합니다.',
    authorUsername: 'woosgem',
    icon: '📋',
    tags: ['documentation', 'planning', 'product'],
    qualityScore: { totalScore: 87, grade: 'A' as const },
    minModel: 'sonnet',
    baseTokens: 2500,
    installCount: 892,
  },
  {
    id: 'skill_6',
    name: 'sql-optimizer',
    description: 'SQL 쿼리를 분석하고 성능 최적화를 제안하는 스킬입니다.',
    authorUsername: 'thrall-dev',
    icon: '🗄️',
    tags: ['database', 'sql', 'performance'],
    qualityScore: { totalScore: 83, grade: 'A' as const },
    minModel: 'sonnet',
    baseTokens: 2000,
    installCount: 567,
  },
  {
    id: 'skill_3',
    name: 'test-generator',
    description: '코드를 분석하여 테스트 케이스를 자동으로 생성하는 스킬입니다.',
    authorUsername: 'thrall-dev',
    icon: '🧪',
    tags: ['testing', 'automation'],
    qualityScore: { totalScore: 75, grade: 'B' as const },
    minModel: 'haiku',
    baseTokens: 1200,
    installCount: 456,
  },
  {
    id: 'skill_5',
    name: 'api-documenter',
    description: 'REST API 엔드포인트를 분석하여 OpenAPI 스펙 문서를 생성합니다.',
    authorUsername: 'woosgem',
    icon: '📖',
    tags: ['documentation', 'api'],
    qualityScore: { totalScore: 68, grade: 'C' as const },
    minModel: 'haiku',
    baseTokens: 1500,
    installCount: 234,
  },
];

const categories = [
  { id: 'all', label: '전체', icon: '📦' },
  { id: 'coding', label: '개발', icon: '💻' },
  { id: 'documentation', label: '문서화', icon: '📝' },
  { id: 'design', label: '디자인', icon: '🎨' },
  { id: 'testing', label: '테스트', icon: '🧪' },
  { id: 'devops', label: 'DevOps', icon: '🔧' },
];

export default function HomePage() {
  const featuredSkills = mockSkills.filter((s) => s.qualityScore.grade === 'S');
  const popularSkills = [...mockSkills].sort((a, b) => (b.installCount || 0) - (a.installCount || 0)).slice(0, 6);

  return (
    <>
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-purple-50 to-white px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            {/* Value Proposition */}
            <div className="mb-4 inline-block rounded-full bg-purple-100 px-4 py-1 text-sm font-medium text-purple-700">
              🎯 설치 전에 AI가 검증합니다
            </div>

            <h1 className="mb-4 text-4xl font-bold text-gray-900">
              ⚡ SkillHub
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              AI 스킬의 품질을 미리 확인하고, 내 상황에 맞는 스킬을 추천받으세요
            </p>

            {/* Search */}
            <div className="mx-auto mb-8 max-w-xl">
              <div className="flex items-center rounded-lg border bg-white p-2 shadow-sm">
                <input
                  type="text"
                  placeholder="어떤 스킬을 찾으시나요?"
                  className="flex-1 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none"
                />
                <button className="rounded-md bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
                  검색
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                💡 Tip: <kbd className="rounded bg-gray-100 px-1">⌘K</kbd>로 AI 추천 받기
              </p>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/skills?category=${cat.id}`}
                  className="rounded-full border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-purple-300 hover:bg-purple-50"
                >
                  {cat.icon} {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Skills (S Grade) */}
        {featuredSkills.length > 0 && (
          <section className="px-4 py-12">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">⭐ Featured (S등급)</h2>
                <Link href="/skills?grade=S" className="text-purple-600 hover:underline">
                  더보기 →
                </Link>
              </div>
              <SkillGrid skills={featuredSkills} />
            </div>
          </section>
        )}

        {/* Popular Skills */}
        <section className="bg-gray-50 px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">🔥 인기 스킬</h2>
              <Link href="/skills?sort=popular" className="text-purple-600 hover:underline">
                더보기 →
              </Link>
            </div>
            <SkillGrid skills={popularSkills} />
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-8 text-2xl font-bold text-gray-900">🤖 어떻게 작동하나요?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 text-4xl">🔍</div>
                <h3 className="mb-2 font-semibold">1. 스킬 검색</h3>
                <p className="text-sm text-gray-600">
                  필요한 스킬을 검색하거나 AI에게 추천받으세요
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="mb-2 font-semibold">2. 품질 확인</h3>
                <p className="text-sm text-gray-600">
                  AI가 분석한 품질 점수와 비용을 미리 확인하세요
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 text-4xl">⚡</div>
                <h3 className="mb-2 font-semibold">3. 바로 사용</h3>
                <p className="text-sm text-gray-600">
                  검증된 스킬을 안심하고 설치하세요
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
