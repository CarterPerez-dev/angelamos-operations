// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import styles from './angela.module.scss'

export function AngelaPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.imageContainer}>
          <img
            src="/angela/1.webp"
            alt="Angela"
            className={styles.image}
          />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.textBlock}>
            <div className={styles.line}>The high performers</div>
            <div className={styles.line}>are the ones that GIVE themselves</div>
            <div className={styles.line}>alot of TIME</div>
            <div className={styles.line}>to work UP to something</div>
          </div>

          <div className={styles.textBlock}>
            <div className={styles.line}>I'm gonan fucking fail</div>
            <div className={styles.line}>I'm gonan fucking FAIL</div>
            <div className={styles.line}>I'm gonan fucking fail</div>
            <div className={styles.line}>I'm gonan fucking fail</div>
          </div>

          <div className={styles.textBlock}>
            <div className={styles.line}>And I will SUCEED....</div>
          </div>
        </div>
      </div>
    </div>
  )
}
