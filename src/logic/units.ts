import type { Course, Term, UnitProgress } from '../types'

export const unitKey = (courseId: string, week: number) => `${courseId}:${week}`

export const emptyProgress = (): UnitProgress => ({
  done: false,
  steps: {},
  keyPoints: '',
  unclear: '',
})

export function getUnit(term: Term, courseId: string, week: number): UnitProgress {
  return term.units[unitKey(courseId, week)] ?? emptyProgress()
}

export interface UnitRef {
  course: Course
  week: number
}

/** All units in rotation order: every course's Week 1, then every Week 2, and so on. */
export function orderedUnits(term: Term): UnitRef[] {
  const maxWeeks = Math.max(0, ...term.courses.map((c) => c.weeks))
  const out: UnitRef[] = []
  for (let week = 1; week <= maxWeeks; week++) {
    for (const course of term.courses) {
      if (week <= course.weeks) out.push({ course, week })
    }
  }
  return out
}

export function isDone(term: Term, ref: UnitRef): boolean {
  return getUnit(term, ref.course.id, ref.week).done
}

/** The suggested unit for today: first not-done unit in rotation order. */
export function nextUnit(term: Term): UnitRef | null {
  return orderedUnits(term).find((u) => !isDone(term, u)) ?? null
}

export function progressCounts(term: Term) {
  const all = orderedUnits(term)
  const done = all.filter((u) => isDone(term, u)).length
  return { total: all.length, done, remaining: all.length - done }
}

export function courseProgress(term: Term, course: Course) {
  let done = 0
  for (let w = 1; w <= course.weeks; w++) if (getUnit(term, course.id, w).done) done++
  return { total: course.weeks, done }
}

/** The topic planned for a unit, or an empty string. */
export const topicOf = (course: Course, week: number): string => (course.topics?.[week - 1] ?? '').trim()
