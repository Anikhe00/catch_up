import type { DateStr, Term } from '../types'
import { addDays, daysBetween } from './dates'
import { orderedUnits, progressCounts } from './units'

/** A busy day counts as half a day of capacity. */
export const BUSY_WEIGHT = 0.5

export function dayWeight(term: Term, day: DateStr): number {
  return term.busyDays[day] ? BUSY_WEIGHT : 1
}

/** Capacity in full-day equivalents across from..to, both inclusive. */
export function capacity(term: Term, from: DateStr, to: DateStr): number {
  const n = daysBetween(from, to) + 1
  let total = 0
  for (let i = 0; i < n; i++) total += dayWeight(term, addDays(from, i))
  return total
}

export type Phase = 'study' | 'writing'

export type PaceStatus =
  | { kind: 'on-track' }
  | { kind: 'behind'; units: number }
  | { kind: 'ahead'; units: number }

export interface Pace {
  phase: Phase
  total: number
  done: number
  remaining: number
  daysToTarget: number
  daysToDeadline: number
  isBusyToday: boolean
  /** Units finished today. */
  doneToday: number
  /** Exact units needed today, based on what was left at the start of the day. */
  todayTarget: number
  /** todayTarget rounded up to a whole unit. */
  todayUnits: number
  status: PaceStatus
}

const EPS = 1e-9

export function computePace(term: Term, today: DateStr): Pace {
  const { total, done, remaining } = progressCounts(term)
  const refs = orderedUnits(term)

  // Units pre-marked in setup have no completion date. They are not part of the plan.
  let prior = 0
  let doneToday = 0
  for (const r of refs) {
    const u = term.units[`${r.course.id}:${r.week}`]
    if (!u?.done) continue
    if (!u.doneOn) prior++
    else if (u.doneOn === today) doneToday++
  }

  const daysToTarget = daysBetween(today, term.targetDate)
  const daysToDeadline = daysBetween(today, term.deadlineDate)
  const phase: Phase = daysToTarget < 0 ? 'writing' : 'study'
  const isBusyToday = !!term.busyDays[today]

  // Daily target: what was left at the start of today, spread over today's capacity onward.
  const remainingAtStart = remaining + doneToday
  const capFromToday = phase === 'study' ? capacity(term, today, term.targetDate) : 0
  const perFullDay = capFromToday > 0 ? remainingAtStart / capFromToday : remainingAtStart
  const todayTarget = remainingAtStart === 0 ? 0 : perFullDay * (isBusyToday ? BUSY_WEIGHT : 1)

  // Pace: compare progress with an even plan across the whole study window, through end of today.
  const planned = total - prior
  const achieved = done - prior
  const capTotal = capacity(term, term.startDate, term.targetDate)
  const capElapsed =
    daysBetween(term.startDate, today) < 0
      ? 0
      : capacity(term, term.startDate, today > term.targetDate ? term.targetDate : today)
  const expected = capTotal > 0 ? (planned * capElapsed) / capTotal : planned
  const diff = achieved - expected

  let status: PaceStatus = { kind: 'on-track' }
  if (diff >= 1 - EPS) status = { kind: 'ahead', units: Math.floor(diff + EPS) }
  else if (diff <= -1 + EPS) status = { kind: 'behind', units: Math.floor(-diff + EPS) }

  return {
    phase,
    total,
    done,
    remaining,
    daysToTarget,
    daysToDeadline,
    isBusyToday,
    doneToday,
    todayTarget,
    todayUnits: Math.ceil(todayTarget - EPS),
    status,
  }
}
