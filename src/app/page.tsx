'use client';

import { useState } from 'react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    // TODO: AI-powered skill search
    console.log('Searching for:', query);
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Agent Builder</span>
            <span className="text-zinc-500 text-sm">beta</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="/skills" className="text-zinc-400 hover:text-white text-sm">
              Skills
            </a>
            <a href="/docs" className="text-zinc-400 hover:text-white text-sm">
              Docs
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            무엇을 하고 싶으세요?
          </h1>
          <p className="text-xl text-zinc-400">
            원하는 것을 말해주세요. 최적의 스킬을 찾아드립니다.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-16">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="예: 코드 리뷰를 자동화하고 싶어"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-6 py-4 text-lg
                         placeholder-zinc-500 focus:outline-none focus:border-zinc-500
                         transition-colors"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 
                         bg-white text-black px-4 py-2 rounded-md font-medium
                         hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {isSearching ? '검색 중...' : '찾기'}
            </button>
          </div>
        </form>

        {/* Example queries */}
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">이런 것들을 물어보세요</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'PR 리뷰 자동화',
              'API 문서 생성',
              '테스트 코드 작성',
              'Figma to Code',
              'SQL 최적화',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full
                           text-sm text-zinc-400 hover:border-zinc-600 hover:text-white
                           transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Powered by skills.sh ecosystem</span>
            <div className="flex items-center gap-4">
              <a href="https://skills.sh" target="_blank" rel="noopener noreferrer" 
                 className="hover:text-white">
                skills.sh
              </a>
              <a href="https://github.com/woosgem-dev/skillhub" target="_blank" rel="noopener noreferrer"
                 className="hover:text-white">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
