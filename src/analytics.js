import analytics from '@react-native-firebase/analytics'

// Silent wrapper — if Firebase isn't configured yet, events are swallowed
const track = async (event, params = {}) => {
  try {
    await analytics().logEvent(event, params)
  } catch (_) {}
}

// ── Screen tracking ───────────────────────────────────────────────────────────
export const trackScreen = async (name) => {
  try {
    await analytics().logScreenView({ screen_name: name, screen_class: name })
  } catch (_) {}
}

// ── Task events ───────────────────────────────────────────────────────────────
export const trackTaskCreated  = (tag = 'other') => track('task_created',   { tag })
export const trackTaskStarted  = ()              => track('task_started')
export const trackTaskPaused   = ()              => track('task_paused')
export const trackTaskCompleted = ()             => track('task_completed')
export const trackTaskDeleted  = ()              => track('task_deleted')

// ── Export event ──────────────────────────────────────────────────────────────
export const trackExport = (format = 'xlsx') => track('export_triggered', { format })

// ── Feedback events ───────────────────────────────────────────────────────────
export const trackFeedbackOpened    = () => track('feedback_opened')
export const trackFeedbackDismissed = () => track('feedback_dismissed')
