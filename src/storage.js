import AsyncStorage from '@react-native-async-storage/async-storage'
import { STORAGE_KEY, THEME_KEY, TEMPLATES_KEY, USERNAME_KEY, AUTH_KEY } from './constants'

export async function loadTasks() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {}
}

export async function loadTheme() {
  try {
    const theme = await AsyncStorage.getItem(THEME_KEY)
    return theme === 'dark'
  } catch {}
  return false
}

export async function saveTheme(isDark) {
  try {
    await AsyncStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light')
  } catch {}
}

export async function loadTemplates() {
  try {
    const raw = await AsyncStorage.getItem(TEMPLATES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

export async function saveTemplates(templates) {
  try {
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  } catch {}
}

export async function loadUserName() {
  try {
    const name = await AsyncStorage.getItem(USERNAME_KEY)
    return name || ''
  } catch {}
  return ''
}

export async function saveUserName(name) {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, name)
  } catch {}
}

export async function loadAuth() {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export async function saveAuth(user) {
  try {
    if (user) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user))
    } else {
      await AsyncStorage.removeItem(AUTH_KEY)
    }
  } catch {}
}
