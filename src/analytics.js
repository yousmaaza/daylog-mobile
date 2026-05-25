import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Firebase Measurement Protocol v2 ─────────────────────────────────────────
// No native SDK — pure HTTP. Works with any build (Expo Go, EAS, simulator).
//
// To activate: fill MEASUREMENT_ID and API_SECRET from:
//   Firebase Console → Analytics → Admin → Data Streams → your iOS stream
//   → Measurement Protocol API secrets → Create
const MEASUREMENT_ID = 'G-Q0B9FWJFCC'
const API_SECRET      = 's6v6CCL4RmGENEdhw9itbw' // Measurement Protocol API secret (daylog-mobile)

const ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`
const CLIENT_ID_KEY = 'dl-analytics-cid'

// Stable anonymous device ID (generated once, persisted in AsyncStorage)
let _clientId = null
async function getClientId() {
  if (_clientId) return _clientId
  let cid = await AsyncStorage.getItem(CLIENT_ID_KEY)
  if (!cid) {
    cid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    await AsyncStorage.setItem(CLIENT_ID_KEY, cid)
  }
  _clientId = cid
  return cid
}

// Silent fire-and-forget — never throws, never blocks the UI
const track = async (name, params = {}) => {
  if (!MEASUREMENT_ID || !API_SECRET) return
  try {
    const client_id = await getClientId()
    const eventParams = { ...params, engagement_time_msec: 100 }
    if (__DEV__) eventParams.debug_mode = 1
    const body = JSON.stringify({ client_id, events: [{ name, params: eventParams }] })
    await fetch(ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  } catch (e) { if (__DEV__) console.warn('[Analytics] error', e) }
}

// ── Screen tracking ───────────────────────────────────────────────────────────
export const trackScreen = (name) =>
  track('screen_view', { screen_name: name, screen_class: name })

// ── Task events ───────────────────────────────────────────────────────────────
export const trackTaskCreated   = (tag = 'other') => track('task_created',   { tag })
export const trackTaskStarted   = ()              => track('task_started')
export const trackTaskPaused    = ()              => track('task_paused')
export const trackTaskCompleted = ()              => track('task_completed')
export const trackTaskDeleted   = ()              => track('task_deleted')

// ── Export event ──────────────────────────────────────────────────────────────
export const trackExport = (format = 'xlsx') => track('export_triggered', { format })

// ── Feedback events ───────────────────────────────────────────────────────────
export const trackFeedbackOpened    = () => track('feedback_opened')
export const trackFeedbackDismissed = () => track('feedback_dismissed')
