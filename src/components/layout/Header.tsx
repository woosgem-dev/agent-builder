'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-xl">SkillHub</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/skills" className="text-gray-600 hover:text-gray-900">
            스킬
          </Link>
          <Link href="/rankings" className="text-gray-600 hover:text-gray-900">
            랭킹
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search (compact) */}
          <button className="p-2 text-gray-600 hover:text-gray-900">
            🔍
          </button>

          {/* Login */}
          <Link
            href="/auth/login"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
}
