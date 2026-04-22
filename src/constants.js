export const HOUR_H = 64
export const TIMELINE_START = 0
export const TIMELINE_END = 24
export const STORAGE_KEY   = 'dl-tasks-v3'
export const THEME_KEY     = 'dl-theme'
export const TEMPLATES_KEY = 'dl-templates'
export const USERNAME_KEY  = 'dl-username'
export const AUTH_KEY            = 'dl-auth'
export const NOTIFICATIONS_KEY   = 'dl-notifications'

export const DEFAULT_TAGS = [
  { id: 'work',         label: 'Work',         color: '#FFFFFF', bg: '#EDE9FF', border: '#D4CAFC', dot: '#7C5CFC', textColor: '#4C2FB0' },
  { id: 'sport',        label: 'Sport',        color: '#FFFFFF', bg: '#D1FAE5', border: '#A7F3D0', dot: '#10B981', textColor: '#065F46' },
  { id: 'meeting',      label: 'Meeting',      color: '#FFFFFF', bg: '#FFF4D6', border: '#FFE9A0', dot: '#F59E0B', textColor: '#92400E' },
  { id: 'lunch_dinner', label: 'Lunch/Dinner', color: '#FFFFFF', bg: '#E0F7FF', border: '#BAE6FD', dot: '#38BDF8', textColor: '#0369A1' },
  { id: 'commute',      label: 'Commute',      color: '#FFFFFF', bg: '#E0F2FE', border: '#BAE0FF', dot: '#06B6D4', textColor: '#0E7490' },
  { id: 'study',        label: 'Study',        color: '#FFFFFF', bg: '#FCE7F3', border: '#F9C4E0', dot: '#EC4899', textColor: '#9D174D' },
  { id: 'home',         label: 'Home',         color: '#FFFFFF', bg: '#FFE4E1', border: '#FFCDC8', dot: '#F97316', textColor: '#9A3412' },
  { id: 'personal',     label: 'Personal',     color: '#FFFFFF', bg: '#FFE8F3', border: '#FFC6E4', dot: '#F472B6', textColor: '#BE185D' },
  { id: 'other',        label: 'Other',        color: '#FFFFFF', bg: '#F5F3FF', border: '#E8E3FF', dot: '#8078A0', textColor: '#5A527A' },
]

export const getTaskPalette = (task) => {
  const tagId = task.tagId || (task.tags && task.tags[0]) || 'other'
  return DEFAULT_TAGS.find(t => t.id === tagId) || DEFAULT_TAGS.find(t => t.id === 'other')
}

// Keep TASK_PALETTE for old usages that we haven't migrated yet
export const TASK_PALETTE = DEFAULT_TAGS

export const DAY_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_FULL   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Design tokens ────────────────────────────────────────────────────────────

export const COLORS = {
  light: {
    bgApp:        '#F0EDFF',
    bgPanel:      '#FFFFFF',
    bgCard:       '#FFFFFF',
    bgInput:      '#F5F3FF',
    bgSelected:   '#1A1030',

    inkPrimary:   '#1A1030',
    inkSecondary: '#3D3060',
    inkMuted:     '#8078A0',
    inkFaint:     '#C4BEE0',

    amber:        '#7C5CFC',
    amberLight:   'rgba(124,92,252,0.1)',
    amberWarm:    '#9B7BFF',
    emerald:      '#10B981',
    emeraldLight: 'rgba(16,185,129,0.1)',

    border:       '#E8E3FF',
    borderStrong: '#D0C8FF',
    tabBar:       '#1A1030',
    statusBar:    'dark',

    accent:       '#7C5CFC',
  },
  dark: {
    bgApp:        '#0E0B18',
    bgPanel:      '#17132A',
    bgCard:       '#1E1B30',
    bgInput:      '#252238',
    bgSelected:   '#F0EDFF',

    inkPrimary:   '#F0EDFF',
    inkSecondary: '#C0B8E0',
    inkMuted:     '#7A7295',
    inkFaint:     '#3E3A60',

    amber:        '#9B7BFF',
    amberLight:   'rgba(155,123,255,0.12)',
    amberWarm:    '#B89BFF',
    emerald:      '#34D399',
    emeraldLight: 'rgba(52,211,153,0.12)',

    border:       '#2A2545',
    borderStrong: '#3D3660',
    tabBar:       '#0A0818',
    statusBar:    'light',

    accent:       '#9B7BFF',
  },
}
