import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSearch } from '@/components/common/HeroSearch';
import { CategoryTabs } from '@/components/common/CategoryTabs';
import { SkillGrid } from '@/components/skill/SkillGrid';

export default function HomePage() {
  return (
    <>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              ⚡ SkillHub
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI 스킬의 GitHub — 누구나 쉽게 발견하고 사용
            </p>
            <HeroSearch />
            <div className="mt-8">
              <CategoryTabs />
            </div>
          </div>
        </section>

        {/* Popular Skills */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔥 인기 스킬</h2>
              <a href="/skills" className="text-blue-600 hover:underline">
                더보기 →
              </a>
            </div>
            <SkillGrid type="popular" />
          </div>
        </section>

        {/* Latest Skills */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🆕 최신 스킬</h2>
              <a href="/skills" className="text-blue-600 hover:underline">
                더보기 →
              </a>
            </div>
            <SkillGrid type="latest" />
          </div>
        </section>

        {/* Rankings Preview */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🏆 랭킹 TOP 10</h2>
              <a href="/rankings" className="text-blue-600 hover:underline">
                전체보기 →
              </a>
            </div>
            {/* RankingPreview component */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">랭킹 미리보기 (준비 중)</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
