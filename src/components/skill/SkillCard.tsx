import Link from 'next/link';

export interface SkillCardProps {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rating: number;
  tags: string[];
  author: string;
}

export function SkillCard({
  id,
  name,
  description,
  icon = '📦',
  rating,
  tags,
  author,
}: SkillCardProps) {
  return (
    <Link
      href={`/skills/${id}`}
      className="block bg-white rounded-lg border hover:shadow-lg transition-shadow p-4"
    >
      {/* Icon & Name */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-gray-500">by {author}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1 text-sm">
        <span className="text-yellow-500">⭐</span>
        <span className="font-medium">{rating.toFixed(1)}</span>
      </div>
    </Link>
  );
}
