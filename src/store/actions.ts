import type { Assessment, DateStr, Term, UnitProgress } from '../types'
import { addDays } from '../logic/dates'
import { emptyProgress, unitKey } from '../logic/units'

function withUnit(t: Term, courseId: string, week: number, fn: (u: UnitProgress) => UnitProgress): Term {
  const k = unitKey(courseId, week)
  return { ...t, units: { ...t.units, [k]: fn(t.units[k] ?? emptyProgress()) } }
}

export function setUnitDone(t: Term, courseId: string, week: number, done: boolean, today: DateStr): Term {
  return withUnit(t, courseId, week, (u) => {
    if (done) return { ...u, done: true, doneOn: today }
    const { doneOn: _removed, ...rest } = u
    return { ...rest, done: false }
  })
}

/** Completing every step marks the unit done. Unticking a step on a done unit reopens it. */
export function toggleStep(t: Term, courseId: string, week: number, stepId: string, today: DateStr): Term {
  return withUnit(t, courseId, week, (u) => {
    const on = !u.steps[stepId]
    const steps = { ...u.steps, [stepId]: on }
    const allDone = t.routine.length > 0 && t.routine.every((s) => steps[s.id])
    if (allDone) return { ...u, steps, done: true, doneOn: u.doneOn ?? today }
    if (!on && u.done) {
      const { doneOn: _removed, ...rest } = u
      return { ...rest, steps, done: false }
    }
    return { ...u, steps }
  })
}

export function setUnitText(
  t: Term,
  courseId: string,
  week: number,
  field: 'keyPoints' | 'unclear',
  value: string,
): Term {
  return withUnit(t, courseId, week, (u) => ({ ...u, [field]: value }))
}

export function toggleBusy(t: Term, day: DateStr): Term {
  const busyDays = { ...t.busyDays }
  if (busyDays[day]) delete busyDays[day]
  else busyDays[day] = true
  return { ...t, busyDays }
}

/** A blank term for the next round, keeping courses and routine steps but none of the progress. */
export function freshTerm(prev: Term, today: DateStr): Term {
  return {
    id: crypto.randomUUID(),
    name: '',
    unitLabel: prev.unitLabel,
    studyStyle: prev.studyStyle,
    slotMode: prev.slotMode,
    startDate: today,
    targetDate: addDays(today, 30),
    deadlineDate: addDays(today, 44),
    courses: prev.courses.map((c) => ({
      ...c,
      id: crypto.randomUUID(),
      topics: [],
      finishBy: undefined,
      assessment: c.assessment ? { type: c.assessment.type } : undefined,
    })),
    routine: prev.routine.map((s) => ({ ...s })),
    units: {},
    busyDays: {},
  }
}

function withCourse(t: Term, courseId: string, fn: (a: Assessment | undefined) => Assessment | undefined): Term {
  return { ...t, courses: t.courses.map((c) => (c.id === courseId ? { ...c, assessment: fn(c.assessment) } : c)) }
}

/** Records the assessment as taken, with an optional score. */
export function takeAssessment(t: Term, courseId: string, takenOn: DateStr, score: string): Term {
  return withCourse(t, courseId, (a) => (a ? { ...a, takenOn, score: score.trim() || undefined } : a))
}

export function untakeAssessment(t: Term, courseId: string): Term {
  return withCourse(t, courseId, (a) => {
    if (!a) return a
    const { takenOn: _t, score: _s, ...rest } = a
    return rest
  })
}
