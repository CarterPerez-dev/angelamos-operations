// ===================
// © AngelaMos | 2026
// NoteEditor.tsx
// ===================

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import jsPDF from 'jspdf'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { search, searchKeymap, openSearchPanel } from '@codemirror/search'
import { markdown } from '@codemirror/lang-markdown'
import { darkTheme } from './codemirror-theme'
import type { Note } from '../types/notes.types'
import styles from '../pages/NotesPage.module.scss'

interface NoteEditorProps {
  selectedNote: Note | undefined
  editingContent: string
  hasUnsavedChanges: boolean
  isSaving: boolean
  viewingDeleted: boolean
  onContentChange: (content: string) => void
  onSaveContent: () => void
  onCopyAll: () => void
}

export function NoteEditor({
  selectedNote,
  editingContent,
  hasUnsavedChanges,
  isSaving,
  viewingDeleted,
  onContentChange,
  onSaveContent,
  onCopyAll,
}: NoteEditorProps) {
  const [previewMode, setPreviewMode] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const handleOpenSearch = useCallback(() => {
    if (viewRef.current) {
      openSearchPanel(viewRef.current)
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current || previewMode || !selectedNote) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !viewingDeleted) {
        onContentChange(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: editingContent,
      extensions: [
        darkTheme,
        placeholder('Write your notes here...'),
        history(),
        markdown(),
        search({ top: true }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        updateListener,
        EditorView.editable.of(!viewingDeleted),
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [selectedNote?.id, previewMode, viewingDeleted])

  useEffect(() => {
    if (viewRef.current && !previewMode) {
      const currentContent = viewRef.current.state.doc.toString()
      if (currentContent !== editingContent) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: editingContent,
          },
        })
      }
    }
  }, [editingContent, previewMode])

  const handleExportMarkdown = () => {
    if (!selectedNote) return
    const blob = new Blob([editingContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedNote.title}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    if (!selectedNote) return
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - margin * 2

    doc.setFontSize(16)
    doc.text(selectedNote.title, margin, margin)

    doc.setFontSize(12)
    const lines = doc.splitTextToSize(editingContent, maxWidth)
    doc.text(lines, margin, margin + 10)

    doc.save(`${selectedNote.title}.pdf`)
  }

  return (
    <div className={styles.editorPanel}>
      <div className={styles.editor}>
        {selectedNote ? (
          <>
            <div className={styles.editorHeader}>
              <h2 className={styles.editorTitle}>
                {selectedNote.title}
                {hasUnsavedChanges && !viewingDeleted && (
                  <span className={styles.unsavedIndicator}> *</span>
                )}
              </h2>
              <div className={styles.editorActions}>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={styles.previewToggleBtn}
                >
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                {!previewMode && (
                  <button type="button" onClick={handleOpenSearch} className={styles.findBtn}>
                    Find
                  </button>
                )}
                <button type="button" onClick={handleExportMarkdown} className={styles.exportBtn}>
                  Export MD
                </button>
                <button type="button" onClick={handleExportPDF} className={styles.exportBtn}>
                  Export PDF
                </button>
                <button type="button" onClick={onCopyAll} className={styles.copyBtn}>
                  Copy
                </button>
                <div className={styles.saveStatus}>
                  {viewingDeleted ? (
                    <span className={styles.readOnlyBadge}>Read Only</span>
                  ) : isSaving ? (
                    <span className={styles.savingText}>Saving...</span>
                  ) : hasUnsavedChanges ? (
                    <button type="button" onClick={onSaveContent} className={styles.saveBtn}>
                      Save Now
                    </button>
                  ) : (
                    <span className={styles.savedText}>Saved</span>
                  )}
                </div>
              </div>
            </div>
            {previewMode ? (
              <div className={styles.markdownPreview}>
                <ReactMarkdown>{editingContent || '*No content to preview*'}</ReactMarkdown>
              </div>
            ) : (
              <div ref={editorRef} className={styles.codemirrorWrapper} />
            )}
          </>
        ) : (
          <div className={styles.editorEmpty}>
            Select a note to {viewingDeleted ? 'view' : 'edit'}
          </div>
        )}
      </div>
    </div>
  )
}
