import type { DateStr, Term, UnitProgress, WritingItem } from '../types'
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

export function setWriting(t: Term, writing: WritingItem[]): Term {
  return { ...t, writing }
}

/** A blank term for the next round, keeping courses, routine, and writing steps but none of the progress. */
export function freshTerm(prev: Term, today: DateStr): Term {
  return {
    id: crypto.randomUUID(),
    name: '',
    unitLabel: prev.unitLabel,
    startDate: today,
    targetDate: addDays(today, 30),
    deadlineDate: addDays(today, 44),
    courses: prev.courses.map((c) => ({ ...c, id: crypto.randomUUID(), topics: [] })),
    routine: prev.routine.map((s) => ({ ...s })),
    writing: prev.writing.map((w) => ({ ...w, done: false })),
    units: {},
    busyDays: {},
  }
}
