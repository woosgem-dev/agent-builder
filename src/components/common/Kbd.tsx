'use client';

interface KbdProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 min-w-5 h-5',
  md: 'text-sm px-2 py-0.5 min-w-6 h-6',
  lg: 'text-base px-2.5 py-1 min-w-7 h-7',
};

/**
 * Kbd component for displaying keyboard shortcuts.
 * Uses woosgem DS style when available, fallback to local styling.
 */
export function Kbd({ children, size = 'sm', className = '' }: KbdProps) {
  return (
    <kbd
      className={`
        inline-flex items-center justify-center
        font-mono font-medium leading-none whitespace-nowrap
        rounded
        bg-gradient-to-b from-gray-50 to-gray-100
        border border-gray-300
        shadow-[0_1px_0_0_#d1d5db,0_2px_0_0_#e5e7eb,inset_0_-1px_0_0_#e5e7eb]
        text-gray-700
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </kbd>
  );
}
