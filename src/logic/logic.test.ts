import { describe, expect, it } from 'vitest'
import { defaultTerm } from '../data/defaults'
import type { Term } from '../types'
import { addDays, daysBetween, todayStr } from './dates'
import { capacity, computePace } from './pace'
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

describe('rotation', () => {
  it('starts with Week 1 of the first course not yet done', () => {
    const t = term()
    const n = nextUnit(t)!
    expect(n.course.code).toBe('MIT 8103')
    expect(n.week).toBe(1)
  })
  it('finishes every Week 1 before any Week 2', () => {
    const t = term()
    for (let ci = 1; ci < 6; ci++) markDone(t, ci, 1)
    const n = nextUnit(t)!
    expect(n.course.code).toBe('MIT 8101')
    expect(n.week).toBe(2)
  })
  it('returns null when everything is done and skips missing weeks', () => {
    const t = term()
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
  it('switches to writing phase after the study target date', () => {
    const t = term()
    const p = computePace(t, '2026-11-01')
    expect(p.phase).toBe('writing')
    expect(p.daysToDeadline).toBe(13)
  })
  it('target is zero when all units are done', () => {
    const t = term()
    for (const u of orderedUnits(t)) markDone(t, t.courses.indexOf(u.course), u.week, '2026-10-02')
    expect(computePace(t, '2026-10-05').todayTarget).toBe(0)
  })
})
