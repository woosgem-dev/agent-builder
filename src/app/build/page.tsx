import styles from '@/styles/build.module.scss';

export default function AgentBuilderPage() {
  return (
    <div className={styles.container}>
      <section className={styles.chatPanel}>
        <h2 className={styles.panelTitle}>AI Chat</h2>
        <div className={styles.placeholder}>
          에이전트를 만들기 위해 대화를 시작하세요.
        </div>
      </section>

      <section className={styles.formPanel}>
        <h2 className={styles.panelTitle}>Agent Settings</h2>
        <div className={styles.placeholder}>
          폼이 여기에 표시됩니다.
        </div>
      </section>

      <section className={styles.previewPanel}>
        <h2 className={styles.panelTitle}>Preview (.md)</h2>
        <div className={styles.placeholder}>
          생성된 에이전트 .md 파일의 미리보기가 여기에 표시됩니다.
        </div>
      </section>
    </div>
  );
}
