export const HOUR_H = 64
export const TIMELINE_START = 0
export const TIMELINE_END = 24
export const STORAGE_KEY = 'dl-tasks-v3'
export const THEME_KEY = 'dl-theme'
export const TEMPLATES_KEY = 'dl-templates'
export const USERNAME_KEY      = 'dl-username'
export const AUTH_KEY          = 'dl-auth'
export const NOTIFICATIONS_KEY = 'dl-notifications'

export const MAX_TASK_NAME = 100
export const MAX_USER_NAME = 100

export const DEFAULT_TAGS = [
  { id: 'work', label: 'Work', color: '#FFFFFF', bg: '#C8BBFF', border: '#7C5CFC', dot: '#7C5CFC', textColor: '#4C2FB0' },
  { id: 'sport', label: 'Sport', color: '#FFFFFF', bg: '#86EFAC', border: '#10B981', dot: '#10B981', textColor: '#065F46' },
  { id: 'meeting', label: 'Meeting', color: '#FFFFFF', bg: '#FFE082', border: '#F59E0B', dot: '#F59E0B', textColor: '#92400E' },
  { id: 'lunch_dinner', label: 'Lunch/Dinner', color: '#FFFFFF', bg: '#B3E5FC', border: '#0284C7', dot: '#0284C7', textColor: '#0369A1' },
  { id: 'commute', label: 'Commute', color: '#FFFFFF', bg: '#A5F3FC', border: '#0891B2', dot: '#0891B2', textColor: '#0E7490' },
  { id: 'study', label: 'Study', color: '#FFFFFF', bg: '#FDA4AF', border: '#EC4899', dot: '#EC4899', textColor: '#9D174D' },
  { id: 'home', label: 'Home', color: '#FFFFFF', bg: '#FDBA74', border: '#EA580C', dot: '#EA580C', textColor: '#9A3412' },
  { id: 'personal', label: 'Personal', color: '#FFFFFF', bg: '#F9A8D4', border: '#DB2777', dot: '#DB2777', textColor: '#BE185D' },
  { id: 'other', label: 'Other', color: '#FFFFFF', bg: '#DDD6FE', border: '#7C3AED', dot: '#7C3AED', textColor: '#5A527A' },
]

export const getTaskPalette = (task) => {
  if (!task) return DEFAULT_TAGS.find(t => t.id === 'other')
  const tagId = task.tagId || (task.tags && task.tags[0]) || 'other'
  return DEFAULT_TAGS.find(t => t.id === tagId) || DEFAULT_TAGS.find(t => t.id === 'other')
}


export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Design tokens ────────────────────────────────────────────────────────────

export const COLORS = {
  light: {
    bgApp: '#F0EDFF',
    bgPanel: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgInput: '#F5F3FF',
    bgSelected: '#1A1030',

    inkPrimary: '#1A1030',
    inkSecondary: '#3D3060',
    inkMuted: '#8078A0',
    inkFaint: '#C4BEE0',

    amber: '#7C5CFC',
    amberLight: 'rgba(124,92,252,0.1)',
    amberWarm: '#9B7BFF',
    emerald: '#10B981',
    emeraldLight: 'rgba(16,185,129,0.1)',

    border: '#E8E3FF',
    borderStrong: '#D0C8FF',
    tabBar: '#1A1030',
    statusBar: 'dark',

    accent: '#7C5CFC',
  },
  dark: {
    bgApp: '#0E0B18',
    bgPanel: '#17132A',
    bgCard: '#1E1B30',
    bgInput: '#252238',
    bgSelected: '#F0EDFF',

    inkPrimary: '#F0EDFF',
    inkSecondary: '#C0B8E0',
    inkMuted: '#7A7295',
    inkFaint: '#3E3A60',

    amber: '#9B7BFF',
    amberLight: 'rgba(155,123,255,0.12)',
    amberWarm: '#B89BFF',
    emerald: '#34D399',
    emeraldLight: 'rgba(52,211,153,0.12)',

    border: '#2A2545',
    borderStrong: '#3D3660',
    tabBar: '#0A0818',
    statusBar: 'light',

    accent: '#9B7BFF',
  },
}
