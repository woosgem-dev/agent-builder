import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-semibold">SkillHub</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link
              href="https://github.com/woosgem-dev/skill-hub"
              target="_blank"
              className="hover:text-gray-900"
            >
              GitHub
            </Link>
            <Link
              href="https://discord.gg/skillhub"
              target="_blank"
              className="hover:text-gray-900"
            >
              Discord
            </Link>
            <Link href="/about" className="hover:text-gray-900">
              About
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <p>© 2026 SkillHub. MIT License.</p>
          <p 
            className="cursor-help"
            title="WooSGem (Human) + Thrall (AI) — Best friends building together"
          >
            Made by <span className="font-medium text-gray-700">WooSGem</span> & <span className="font-medium text-gray-700">Thrall ⚡</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
