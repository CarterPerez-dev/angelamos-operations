// ===================
// © AngelaMos | 2025
// planner.enums.ts
// ===================

const API_VERSION = 'v1'

export const PLANNER_API = {
  BLOCKS: `/${API_VERSION}/planner/blocks`,
  BLOCK: (id: string) => `/${API_VERSION}/planner/blocks/${id}`,
  NOTES: `/${API_VERSION}/planner/notes`,
  NOTE: (id: string) => `/${API_VERSION}/planner/notes/${id}`,
  FOLDERS: `/${API_VERSION}/planner/folders`,
  FOLDER: (id: string) => `/${API_VERSION}/planner/folders/${id}`,
} as const

export const TIME_BLOCK_COLORS = [
  { key: 'blue', label: 'Blue', value: 'hsl(210, 100%, 50%)' },
  { key: 'green', label: 'Green', value: 'hsl(142, 76%, 45%)' },
  { key: 'amber', label: 'Amber', value: 'hsl(45, 100%, 50%)' },
  { key: 'red', label: 'Red', value: 'hsl(0, 100%, 50%)' },
  { key: 'purple', label: 'Purple', value: 'hsl(270, 100%, 50%)' },
] as const
