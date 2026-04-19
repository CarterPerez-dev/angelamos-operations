// ===================
// © AngelaMos | 2026
// markdownPreview.tsx
// ===================

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github-dark.css'
import styles from './markdownPreview.module.scss'

interface MarkdownPreviewProps {
  source: string
}

export function MarkdownPreview({ source }: MarkdownPreviewProps) {
  return (
    <div className={styles.preview} data-md2pdf-preview>
      <div className={styles.markdownBody}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw]}
        >
          {source}
        </ReactMarkdown>
      </div>
    </div>
  )
}
