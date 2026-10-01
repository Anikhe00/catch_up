export type DateStr = string // YYYY-MM-DD, local time

export interface Course {
  id: string
  code: string
  title: string
  weeks: number
  /** What to study each week. topics[0] is week 1. Optional and may be shorter than weeks. */
  topics?: string[]
}

export interface RoutineStep {
  id: string
  label: string
}

export interface WritingItem {
  id: string
  label: string
  done: boolean
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
  startDate: DateStr
  targetDate: DateStr
  deadlineDate: DateStr
  courses: Course[]
  routine: RoutineStep[]
  writing: WritingItem[]
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
