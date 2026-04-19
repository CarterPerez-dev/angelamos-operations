// ===================
// © AngelaMos | 2026
// markdownEditor.tsx
// ===================

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { searchKeymap } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { useEffect, useRef } from 'react'
import styles from './markdownEditor.module.scss'

interface MarkdownEditorProps {
  initialValue: string
  onChange: (value: string) => void
  width: number
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace",
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: '#fafafa',
    padding: '10px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'hsl(0, 0%, 9%)',
    color: 'hsl(0, 0%, 30.2%)',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'hsl(0, 0%, 12.2%)',
  },
  '.cm-activeLine': {
    backgroundColor: 'hsl(0, 0%, 12.2%)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: '#fafafa',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'hsl(0, 0%, 19.2%)',
  },
})

const darkHighlight = EditorView.theme({}, { dark: true })

export function MarkdownEditor({
  initialValue,
  onChange,
  width,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        history(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        editorTheme,
        darkHighlight,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [initialValue])

  return <div ref={containerRef} className={styles.editor} style={{ width }} />
}
