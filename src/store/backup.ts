import type { AppData } from '../types'
import { isValidDate } from '../logic/dates'

export function exportJson(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function validTerm(t: unknown): boolean {
  if (!isObj(t)) return false
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.unitLabel === 'string' &&
    [t.startDate, t.targetDate, t.deadlineDate].every((d) => typeof d === 'string' && isValidDate(d)) &&
    Array.isArray(t.courses) &&
    t.courses.every((c) => isObj(c) && typeof c.id === 'string' && typeof c.weeks === 'number') &&
    Array.isArray(t.routine) &&
    isObj(t.units) &&
    isObj(t.busyDays)
  )
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string }

export function parseImport(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: "That file isn't valid JSON. Choose a backup exported from Catch-Up." }
  }
  if (!isObj(parsed) || parsed.version !== 1 || !Array.isArray(parsed.terms) || !parsed.terms.every(validTerm)) {
    return { ok: false, error: "That file doesn't look like a Catch-Up backup. Nothing was changed." }
  }
  const current = parsed.currentTermId
  const ids = (parsed.terms as { id: string }[]).map((t) => t.id)
  return {
    ok: true,
    data: {
      version: 1,
      currentTermId: typeof current === 'string' && ids.includes(current) ? current : null,
      terms: parsed.terms as AppData['terms'],
    },
  }
}

export function downloadBackup(data: AppData, today: string) {
  const blob = new Blob([exportJson(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `catch-up-backup-${today}.json`
  a.click()
  URL.revokeObjectURL(url)
}
