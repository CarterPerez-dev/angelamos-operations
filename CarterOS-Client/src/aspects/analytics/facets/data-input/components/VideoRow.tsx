// ===================
// © AngelaMos | 2026
// VideoRow.tsx
// ===================

import { GiBookmark, GiHearts, GiSpeaker, GiTrashCan } from 'react-icons/gi'
import styles from '../pages/dataInputPage.module.scss'
import type { TikTokVideo } from '../types/analytics.types'

interface VideoRowProps {
  video: TikTokVideo
  onDelete: (id: string) => void
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function VideoRow({ video, onDelete }: VideoRowProps) {
  return (
    <div className={styles.tableRow}>
      <div className={styles.colRank}>#{video.rank}</div>
      <div className={styles.colDate}>
        {new Date(video.date_posted).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className={styles.colHook}>
        <div className={styles.hookText}>{video.hook}</div>
        {video.hashtags && video.hashtags.length > 0 && (
          <div className={styles.hashtags}>
            {video.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.hashtag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.colViews}>{formatNumber(video.views)}</div>
      <div className={styles.colMetrics}>
        <span className={styles.metric}>
          <GiHearts /> {formatNumber(video.likes)}
        </span>
        <span className={styles.metric}>
          <GiSpeaker /> {formatNumber(video.comments)}
        </span>
        <span className={styles.metric}>
          <GiBookmark /> {formatNumber(video.bookmarks)}
        </span>
      </div>
      <div className={styles.colActions}>
        {video.video_url && (
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.actionBtn}
          >
            View
          </a>
        )}
        <button
          type="button"
          onClick={() => onDelete(video.id)}
          className={styles.deleteBtn}
        >
          <GiTrashCan />
        </button>
      </div>
    </div>
  )
}
