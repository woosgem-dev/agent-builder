import Link from 'next/link';
import styles from '@/styles/home.module.scss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Agent Builder</h1>
      <p className={styles.description}>
        Claude Code 에이전트를 GUI와 AI 대화로 조립하세요.
        skills.sh의 스킬을 의도 기반으로 검색하고, 에이전트 .md 파일을
        만들 수 있습니다.
      </p>

      <div className={styles.cards}>
        <Link href="/skills" className={styles.card}>
          <h2 className={styles.cardTitle}>Skill Finder</h2>
          <p className={styles.cardDescription}>
            skills.sh 스킬을 의도 기반으로 검색합니다. 이름이 아닌
            description과 tags로 원하는 스킬을 찾으세요.
          </p>
        </Link>

        <Link href="/build" className={styles.card}>
          <h2 className={styles.cardTitle}>Agent Builder</h2>
          <p className={styles.cardDescription}>
            GUI 폼과 AI 대화로 에이전트 .md 파일을 조립합니다. 스킬
            연결과 실시간 미리보기를 지원합니다.
          </p>
        </Link>
      </div>
    </div>
  );
}
