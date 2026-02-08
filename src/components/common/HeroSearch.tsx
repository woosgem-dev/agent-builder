'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@woosgem-dev/react';

export function HeroSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/skills?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        variant="outline"
        size="lg"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="어떤 스킬을 찾고 계세요?"
        className="flex-1"
      />
      <Button type="submit" variant="filled" color="primary" size="lg">
        검색
      </Button>
    </form>
  );
}
