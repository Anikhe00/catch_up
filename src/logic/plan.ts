import type { Course, DateStr, Term } from '../types'
import { addDays, daysBetween } from './dates'
import { capacity } from './pace'
import { studyStyle } from './units'

export interface Slot {
  course: Course
  /** Units still to do, counting any finished today so the slot stays steady through the day. */
  open: number
  /** The day to aim to finish this course and take its assessment. */
  endDate: DateStr
}

/**
 * Splits the days from today to the study target date across the courses that still have work,
 * in course order, in proportion to their open units. Busy days count as half a day.
 */
export function courseSlots(term: Term, today: DateStr): Slot[] {
  if (studyStyle(term) !== 'focus') return []
  if (daysBetween(today, term.targetDate) < 0) return []

  const from = daysBetween(term.startDate, today) < 0 ? term.startDate : today
  const open = term.courses
    .map((course) => {
      let n = 0
      for (let w = 1; w <= course.weeks; w++) {
        const u = term.units[`${course.id}:${w}`]
        if (!u?.done || u.doneOn === today) n++
      }
      return { course, open: n }
    })
    .filter((c) => c.open > 0)
  const total = open.reduce((a, c) => a + c.open, 0)
  if (total === 0) return []

  if (term.slotMode === 'manual') {
    return open.filter((c) => c.course.finishBy).map((c) => ({ ...c, endDate: c.course.finishBy! }))
  }

  const capTotal = capacity(term, from, term.targetDate)
  const slots: Slot[] = []
  let needed = 0
  let cum = 0
  let day = from
  open.forEach((c, i) => {
    needed += (c.open / total) * capTotal
    const last = i === open.length - 1
    while (!last && cum < needed - 1e-9 && daysBetween(day, term.targetDate) > 0) {
      cum += term.busyDays[day] ? 0.5 : 1
      if (cum >= needed - 1e-9) break
      day = addDays(day, 1)
    }
    slots.push({ ...c, endDate: last ? term.targetDate : day })
    if (!last) day = addDays(day, 1)
  })
  return slots
}
