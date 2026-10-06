import type { AssessmentType, Course, Term } from '../types'
import { daysBetween } from './dates'
import { courseProgress } from './units'

export const ASSESSMENT_TYPES: AssessmentType[] = ['cma', 'lab', 'project', 'case']

export const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  cma: 'CMA (quiz)',
  lab: 'Virtual lab',
  project: 'Individual project',
  case: 'Case study',
}

/** none: no assessment set. locked: units still open. ready: all units done, not yet taken. taken: recorded. */
export type CAState = 'none' | 'locked' | 'ready' | 'taken'

export function caState(term: Term, course: Course): CAState {
  const a = course.assessment
  if (!a) return 'none'
  if (a.takenOn) return 'taken'
  const { done, total } = courseProgress(term, course)
  return done === total ? 'ready' : 'locked'
}

export const readyAssessments = (term: Term): Course[] => term.courses.filter((c) => caState(term, c) === 'ready')

/** The day an assessment closes. Falls back to the final deadline when no date is set. */
export const closesOn = (term: Term, course: Course): string => course.assessment?.closes ?? term.deadlineDate

export interface Upcoming {
  course: Course
  /** Negative once it has closed. */
  daysLeft: number
  unitsLeft: number
}

/** Assessments not yet taken that close within `within` days (or have already closed), soonest first. */
export function upcomingAssessments(term: Term, today: string, within = 10): Upcoming[] {
  return term.courses
    .filter((c) => c.assessment && !c.assessment.takenOn)
    .map((course) => {
      const { done, total } = courseProgress(term, course)
      return { course, daysLeft: daysBetween(today, closesOn(term, course)), unitsLeft: total - done }
    })
    .filter((u) => u.daysLeft <= within)
    .sort((a, b) => a.daysLeft - b.daysLeft)
}
