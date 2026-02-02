// ===================
// © AngelaMos | 2026
// codemirror-theme.ts
// ===================

import { EditorView } from '@codemirror/view'

export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#c15f3c',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
    fontSize: '1rem',
    lineHeight: '1.6',
    padding: '24px',
  },
  '.cm-cursor': {
    borderLeftColor: '#c15f3c',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'rgba(193, 95, 60, 0.3)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'rgba(255, 200, 0, 0.4)',
    borderRadius: '2px',
  },
  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(255, 150, 0, 0.6)',
  },
  '.cm-panels': {
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
  },
  '.cm-panel.cm-search': {
    padding: '10px 16px',
    backgroundColor: '#252525',
    borderBottom: '1px solid #333',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px',
  },
  '.cm-panel.cm-search input': {
    backgroundColor: '#1a1a1a !important',
    color: '#e0e0e0 !important',
    border: '1px solid #444 !important',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '13px',
  },
  '.cm-panel.cm-search .cm-button': {
    backgroundColor: '#383838 !important',
    color: '#e0e0e0 !important',
    border: '1px solid #4a4a4a !important',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    backgroundImage: 'none !important',
  },
  '.cm-panel.cm-search .cm-button:hover': {
    backgroundColor: '#4a4a4a !important',
  },
  '.cm-panel.cm-search button[name="close"]': {
    backgroundColor: '#383838 !important',
    color: '#e0e0e0 !important',
    border: '1px solid #4a4a4a !important',
    padding: '4px 10px',
    fontSize: '14px',
    fontWeight: 'bold',
    borderRadius: '4px',
    backgroundImage: 'none !important',
    margin: '10px',
    maxWidth: '1300px',
  },
  '.cm-panel.cm-search label': {
    color: '#bbb !important',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  '.cm-panel.cm-search input[type="checkbox"]': {
    width: '16px',
    height: '16px',
    accentColor: '#c15f3c',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  '.cm-placeholder': {
    color: '#666',
  },
  '.cm-textfield': {
    backgroundColor: '#1a1a1a !important',
    color: '#e0e0e0 !important',
    border: '1px solid #444 !important',
  },
})
