'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Kbd } from '@woosgem-dev/react';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  icon?: string;
  author: string;
  grade?: string;
  tags: string[];
}

const gradeColors: Record<string, string> = {
  S: 'bg-yellow-100 text-yellow-800',
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-gray-100 text-gray-800',
  D: 'bg-red-100 text-red-800',
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/skills/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data.items);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (skill: SearchResult) => {
      setIsOpen(false);
      router.push(`/skills/${skill.id}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto max-w-2xl px-4">
        <div className="overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Search input */}
          <div className="flex items-center border-b px-4">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="스킬 검색... (이름, 태그, 설명)"
              className="h-14 flex-1 border-0 bg-transparent px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            />
            <Kbd className="hidden sm:inline-flex text-gray-500">ESC</Kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-gray-500">검색 중...</div>
            )}

            {!isLoading && query.length >= 2 && results.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                &apos;{query}&apos;에 대한 결과가 없습니다
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <ul className="py-2">
                {results.map((skill, index) => (
                  <li key={skill.id}>
                    <button
                      onClick={() => handleSelect(skill)}
                      className={`w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-gray-50 ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      {/* Icon */}
                      <span className="text-2xl flex-shrink-0">
                        {skill.icon || '📦'}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {skill.name}
                          </span>
                          {skill.grade && (
                            <span
                              className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                gradeColors[skill.grade] || 'bg-gray-100'
                              }`}
                            >
                              {skill.grade}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {skill.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            by {skill.author}
                          </span>
                          {skill.tags.length > 0 && (
                            <div className="flex gap-1">
                              {skill.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow indicator */}
                      {index === selectedIndex && (
                        <span className="text-gray-400">→</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Quick tips */}
            {!query && (
              <div className="p-4 text-sm text-gray-500">
                <p className="mb-2 font-medium">빠른 팁:</p>
                <ul className="space-y-1 text-xs">
                  <li>• 이름으로 검색: <code className="bg-gray-100 px-1 rounded">code review</code></li>
                  <li>• 태그로 검색: <code className="bg-gray-100 px-1 rounded">automation</code></li>
                  <li>• ↑↓ 화살표로 이동, Enter로 선택</li>
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between">
            <span>⌘K로 언제든 열기</span>
            <span>{results.length > 0 ? `${results.length}개 결과` : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}
