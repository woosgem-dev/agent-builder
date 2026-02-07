import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillHub - AI 스킬 마켓플레이스',
  description: 'AI 스킬의 GitHub — 누구나 쉽게 발견하고 사용',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
