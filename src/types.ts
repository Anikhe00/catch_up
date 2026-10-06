export type DateStr = string // YYYY-MM-DD, local time

export type AssessmentType = 'cma' | 'lab' | 'project' | 'case'

export interface Assessment {
  type: AssessmentType
  /** Last day it can be submitted or taken. Optional. */
  closes?: DateStr
  takenOn?: DateStr
  /** Free text so it can be 8/10, 80%, or Pass. */
  score?: string
}

export interface Course {
  id: string
  code: string
  title: string
  weeks: number
  /** What to study each week. topics[0] is week 1. Optional and may be shorter than weeks. */
  topics?: string[]
  /** Aim to finish this course by this day. Only used when the term's course dates are manual. */
  finishBy?: DateStr
  /** The continuous assessment for this course, if any. */
  assessment?: Assessment
}

export interface RoutineStep {
  id: string
  label: string
}

export interface UnitProgress {
  done: boolean
  /** Date it was completed. Missing on units pre-marked during setup. */
  doneOn?: DateStr
  steps: Record<string, boolean>
  keyPoints: string
  unclear: string
}

export interface Term {
  id: string
  name: string
  /** What a unit is called: "Week", "Lecture", "Chapter"... */
  unitLabel: string
  /** 'focus' studies one course at a time. Missing means 'focus'. */
  studyStyle?: 'focus' | 'rotate'
  /** 'auto' splits the study window across courses. 'manual' uses each course's own finish-by date. Missing means 'auto'. */
  slotMode?: 'auto' | 'manual'
  startDate: DateStr
  targetDate: DateStr
  deadlineDate: DateStr
  courses: Course[]
  routine: RoutineStep[]
  /** Keyed by unitKey(courseId, week) */
  units: Record<string, UnitProgress>
  busyDays: Record<DateStr, true>
  archivedAt?: DateStr
}

export interface AppData {
  version: 1
  currentTermId: string | null
  terms: Term[]
}
