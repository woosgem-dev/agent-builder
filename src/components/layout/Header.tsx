'use client';

import Link from 'next/link';
import { Button, IconButton } from '@woosgem-dev/react';

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
        <div className="flex items-center gap-3">
          {/* Search (compact) */}
          <IconButton variant="ghost" color="secondary" size="md" aria-label="검색">
            🔍
          </IconButton>

          {/* Login */}
          <Link href="/auth/login">
            <Button variant="filled" color="primary" size="md">
              로그인
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
