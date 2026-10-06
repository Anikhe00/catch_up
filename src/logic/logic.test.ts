import { describe, expect, it } from 'vitest'
import { defaultTerm } from '../data/defaults'
import type { Term } from '../types'
import { addDays, daysBetween, todayStr } from './dates'
import { caState, closesOn, readyAssessments, upcomingAssessments } from './assessment'
import { capacity, computePace } from './pace'
import { courseSlots } from './plan'
import { takeAssessment, untakeAssessment } from '../store/actions'
import { nextUnit, orderedUnits, unitKey } from './units'

const term = (): Term => defaultTerm()
const markDone = (t: Term, ci: number, week: number, on?: string) => {
  t.units[unitKey(t.courses[ci].id, week)] = { done: true, doneOn: on, steps: {}, keyPoints: '', unclear: '' }
}

describe('dates', () => {
  it('counts days and adds days across month ends', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(todayStr(new Date(2026, 9, 1))).toBe('2026-10-01')
  })
})

const rotating = (): Term => ({ ...defaultTerm(), studyStyle: 'rotate' })

describe('rotation', () => {
  it('starts with Week 1 of the first course not yet done', () => {
    const t = rotating()
    const n = nextUnit(t)!
    expect(n.course.code).toBe('MIT 8103')
    expect(n.week).toBe(1)
  })
  it('finishes every Week 1 before any Week 2', () => {
    const t = rotating()
    for (let ci = 1; ci < 6; ci++) markDone(t, ci, 1)
    const n = nextUnit(t)!
    expect(n.course.code).toBe('MIT 8101')
    expect(n.week).toBe(2)
  })
  it('returns null when everything is done and skips missing weeks', () => {
    const t = rotating()
    t.courses[0].weeks = 2
    expect(orderedUnits(t)).toHaveLength(22)
    for (const u of orderedUnits(t)) markDone(t, t.courses.indexOf(u.course), u.week)
    expect(nextUnit(t)).toBeNull()
  })
})

describe('pace', () => {
  it('has 24 units, 23 remaining, 31 study days on day one', () => {
    const t = term()
    const p = computePace(t, '2026-10-01')
    expect([p.total, p.remaining, p.daysToTarget, p.daysToDeadline]).toEqual([24, 23, 30, 44])
    expect(capacity(t, '2026-10-01', '2026-10-31')).toBe(31)
    expect(p.todayTarget).toBeCloseTo(23 / 31)
    expect(p.todayUnits).toBe(1)
    expect(p.status.kind).toBe('on-track')
  })
  it('a busy day halves today’s target', () => {
    const t = term()
    const normal = computePace(t, '2026-10-01').todayTarget
    t.busyDays['2026-10-01'] = true
    const busy = computePace(t, '2026-10-01')
    expect(busy.isBusyToday).toBe(true)
    // capacity drops to 30.5 as well, so the target is slightly above half
    expect(busy.todayTarget).toBeCloseTo(23 / 30.5 / 2)
    expect(busy.todayTarget).toBeLessThan(normal)
  })
  it('recalculates quietly after missed days and reports behind', () => {
    const t = term()
    const p = computePace(t, '2026-10-16') // 15 days in, nothing done
    expect(p.status).toEqual({ kind: 'behind', units: 11 })
    expect(p.todayTarget).toBeCloseTo(23 / 16)
    expect(p.todayUnits).toBe(2)
  })
  it('reports ahead when well past the plan', () => {
    const t = term()
    for (let ci = 1; ci < 6; ci++) markDone(t, ci, 1, '2026-10-01')
    markDone(t, 0, 2, '2026-10-01')
    const p = computePace(t, '2026-10-02')
    expect(p.status.kind).toBe('ahead')
  })
  it('keeps today’s target steady after finishing a unit today', () => {
    const t = term()
    const before = computePace(t, '2026-10-01').todayTarget
    markDone(t, 1, 1, '2026-10-01')
    const after = computePace(t, '2026-10-01')
    expect(after.doneToday).toBe(1)
    expect(after.todayTarget).toBeCloseTo(before)
  })
  it('switches to the final stretch after the study target date', () => {
    const t = term()
    const p = computePace(t, '2026-11-01')
    expect(p.phase).toBe('final')
    expect(p.daysToDeadline).toBe(13)
  })
  it('target is zero when all units are done', () => {
    const t = term()
    for (const u of orderedUnits(t)) markDone(t, t.courses.indexOf(u.course), u.week, '2026-10-02')
    expect(computePace(t, '2026-10-05').todayTarget).toBe(0)
  })
})

describe('one course at a time', () => {
  it('is the default and stays on a course until its units are done', () => {
    const t = term()
    expect(t.studyStyle ?? 'focus').toBe('focus')
    let n = nextUnit(t)!
    expect([n.course.code, n.week]).toEqual(['MIT 8101', 2])
    markDone(t, 0, 2)
    markDone(t, 0, 3)
    n = nextUnit(t)!
    expect([n.course.code, n.week]).toEqual(['MIT 8101', 4])
    markDone(t, 0, 4)
    n = nextUnit(t)!
    expect([n.course.code, n.week]).toEqual(['MIT 8103', 1])
  })
})

describe('course slots', () => {
  it('splits the study window across courses in order, in proportion to open units', () => {
    const t = term()
    const slots = courseSlots(t, '2026-10-01')
    expect(slots.map((s) => s.course.code)).toEqual(['MIT 8101', 'MIT 8103', 'MIT 8105', 'MIT 8107', 'MIT 8111', 'MIT 8113'])
    expect(slots[0].open).toBe(3)
    expect(slots[1].open).toBe(4)
    // 31 days over 23 units: first course (3 units) ends on day 5, last course ends on the target date
    expect(slots[0].endDate).toBe('2026-10-05')
    expect(slots[5].endDate).toBe('2026-10-31')
    const ends = slots.map((s) => s.endDate)
    expect([...ends].sort()).toEqual(ends)
  })
  it('stays steady when a unit is finished today, and skips finished courses', () => {
    const t = term()
    const before = courseSlots(t, '2026-10-01').map((s) => s.endDate)
    markDone(t, 0, 2, '2026-10-01')
    expect(courseSlots(t, '2026-10-01').map((s) => s.endDate)).toEqual(before)
    for (const w of [3, 4]) markDone(t, 0, w, '2026-10-01')
    expect(courseSlots(t, '2026-10-02')[0].course.code).toBe('MIT 8103')
  })
  it('gives nothing when rotating or after the target date', () => {
    expect(courseSlots(rotating(), '2026-10-01')).toEqual([])
    expect(courseSlots(term(), '2026-11-01')).toEqual([])
  })
  it('a busy day lengthens the first slot', () => {
    const t = term()
    t.busyDays['2026-10-02'] = true
    t.busyDays['2026-10-03'] = true
    const normal = courseSlots(term(), '2026-10-01')[1].endDate
    expect(courseSlots(t, '2026-10-01')[1].endDate >= normal).toBe(true)
  })
})

describe('assessment state', () => {
  it('moves from none to locked to ready to taken', () => {
    const t = term()
    const c = t.courses[1]
    expect(caState(t, c)).toBe('none')
    c.assessment = { type: 'cma' }
    expect(caState(t, c)).toBe('locked')
    for (let w = 1; w <= 4; w++) markDone(t, 1, w)
    expect(caState(t, c)).toBe('ready')
    expect(readyAssessments(t).map((x) => x.code)).toEqual(['MIT 8103'])
    const taken = takeAssessment(t, c.id, '2026-10-09', ' 8/10 ')
    expect(caState(taken, taken.courses[1])).toBe('taken')
    expect(taken.courses[1].assessment?.score).toBe('8/10')
    expect(caState(untakeAssessment(taken, c.id), c)).toBe('ready')
  })
})

describe('manual course dates', () => {
  const manual = () => {
    const t = term()
    t.slotMode = 'manual'
    t.courses[0].finishBy = '2026-10-05'
    t.courses[1].finishBy = '2026-10-12'
    return t
  }
  it('uses each course finish-by date as its slot', () => {
    const slots = courseSlots(manual(), '2026-10-01')
    expect(slots.map((s) => [s.course.code, s.endDate])).toEqual([
      ['MIT 8101', '2026-10-05'],
      ['MIT 8103', '2026-10-12'],
    ])
  })
  it('sets today target from the focus course and its own date', () => {
    const p = computePace(manual(), '2026-10-01')
    expect(p.todayTarget).toBeCloseTo(3 / 5) // 3 open units over Oct 1 to Oct 5
    const auto = computePace(term(), '2026-10-01').todayTarget
    expect(p.todayTarget).not.toBeCloseTo(auto)
  })
  it('falls back to the overall target when the date has passed or is missing', () => {
    const t = manual()
    t.courses[0].finishBy = undefined
    expect(computePace(t, '2026-10-01').todayTarget).toBeCloseTo(23 / 31)
    t.courses[0].finishBy = '2026-09-30'
    expect(computePace(t, '2026-10-01').todayTarget).toBeCloseTo(23 / 31)
  })
})

describe('assessment reminders', () => {
  it('falls back to the final deadline and only lists soon or past dates', () => {
    const t = term()
    t.courses[0].assessment = { type: 'cma' }
    t.courses[1].assessment = { type: 'lab', closes: '2026-10-08' }
    t.courses[2].assessment = { type: 'case', closes: '2026-10-20' }
    expect(closesOn(t, t.courses[0])).toBe('2026-11-14')
    const up = upcomingAssessments(t, '2026-10-05')
    expect(up.map((u) => [u.course.code, u.daysLeft])).toEqual([['MIT 8103', 3]])
    expect(upcomingAssessments(t, '2026-11-10').map((u) => u.course.code)).toEqual(['MIT 8103', 'MIT 8105', 'MIT 8101'])
  })
  it('includes closed ones and drops taken ones', () => {
    const t = term()
    t.courses[1].assessment = { type: 'lab', closes: '2026-10-01' }
    expect(upcomingAssessments(t, '2026-10-05')[0].daysLeft).toBe(-4)
    t.courses[1].assessment = { type: 'lab', closes: '2026-10-01', takenOn: '2026-10-02' }
    expect(upcomingAssessments(t, '2026-10-05')).toEqual([])
  })
})
