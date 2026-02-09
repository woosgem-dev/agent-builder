import type { Metadata } from 'next';
import Link from 'next/link';
import '@woosgem-dev/styles';
import '@/styles/globals.scss';
import styles from '@/styles/layout.module.scss';

export const metadata: Metadata = {
  title: 'Agent Builder',
  description:
    'Claude Code 에이전트를 GUI + AI 대화로 조립하는 웹앱',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            Agent Builder
          </Link>
          <nav className={styles.nav}>
            <Link href="/skills" className={styles.navLink}>
              Skill Finder
            </Link>
            <Link href="/build" className={styles.navLink}>
              Build
            </Link>
          </nav>
        </header>
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
