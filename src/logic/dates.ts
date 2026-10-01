import type { DateStr } from '../types'

const MS_PER_DAY = 86_400_000

function toDayNumber(d: DateStr): number {
  const [y, m, day] = d.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, day) / MS_PER_DAY)
}

function fromDayNumber(n: number): DateStr {
  return new Date(n * MS_PER_DAY).toISOString().slice(0, 10)
}

export function todayStr(now: Date = new Date()): DateStr {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

/** Whole days from a to b. Negative if b is before a. */
export function daysBetween(a: DateStr, b: DateStr): number {
  return toDayNumber(b) - toDayNumber(a)
}

export function addDays(d: DateStr, n: number): DateStr {
  return fromDayNumber(toDayNumber(d) + n)
}

export function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && fromDayNumber(toDayNumber(d)) === d
}
