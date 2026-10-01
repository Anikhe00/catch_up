import type { AppData } from '../types'
import { emptyAppData } from '../data/defaults'

export const STORAGE_KEY = 'catch-up:data'

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyAppData()
    const parsed = JSON.parse(raw)
    if (parsed?.version === 1 && Array.isArray(parsed.terms)) return parsed as AppData
  } catch {
    // fall through to empty data
  }
  return emptyAppData()
}

export function saveData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
