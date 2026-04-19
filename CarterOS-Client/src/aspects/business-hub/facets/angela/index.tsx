// ===================
// © AngelaMos | 2026
// index.tsx
// ===================

import styles from './angela.module.scss'

export function MossPage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.imageContainer}>
          <img src="/angela/1.webp" alt="Angela" className={styles.image} />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.textBlock}>
            <div className={styles.line}>The high performers</div>
            <div className={styles.line}>are the ones that GIVE themselves</div>
            <div className={styles.line}>alot of TIME</div>
            <div className={styles.line}>to work UP to something</div>
          </div>

          <div className={styles.textBlock}>
            <div className={styles.line}>Where as people who are</div>
            <div className={styles.line}>low performers, less successful</div>
            <div className={styles.line}>have very small transitions</div>
            <div className={styles.line}>if you pay attention to your life</div>
            <div className={styles.line}>
              what you'll find is that there is a correlation{' '}
            </div>
            <div className={styles.line}>between rabid transitions</div>
          </div>

          <div className={styles.textBlock}>
            <div className={styles.line}>And doing the wrong thing</div>
          </div>
        </div>
      </div>
    </div>
  )
}
