'use client';

import { useState } from 'react';
import Link from 'next/link';

const categories = [
  { id: 'all', label: '전체', icon: '📦' },
  { id: 'planning', label: '기획', icon: '📋' },
  { id: 'design', label: '디자인', icon: '🎨' },
  { id: 'qa', label: 'QA', icon: '🧪' },
  { id: 'dev', label: '개발', icon: '⚙️' },
  { id: 'devops', label: 'DevOps', icon: '🚀' },
];

export function CategoryTabs() {
  const [active, setActive] = useState('all');

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={cat.id === 'all' ? '/skills' : `/skills?category=${cat.id}`}
          onClick={() => setActive(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat.id
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {cat.icon} {cat.label}
        </Link>
      ))}
    </div>
  );
}
