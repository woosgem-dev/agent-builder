import styles from '@/styles/skills.module.scss';

export default function SkillFinderPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Skill Finder</h1>

      <div className={styles.searchBar}>
        {/* TODO: Search input component */}
      </div>

      <div className={styles.results}>
        <p className={styles.placeholder}>
          스킬을 검색하려면 위 검색창에 의도를 입력하세요.
        </p>
      </div>
    </div>
  );
}
