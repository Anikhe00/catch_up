import { describe, expect, it } from 'vitest'
import { defaultTerm } from '../data/defaults'
import { getUnit } from '../logic/units'
import { freshTerm, setUnitDone, toggleBusy, toggleStep } from './actions'
import { exportJson, parseImport } from './backup'

describe('actions', () => {
  it('completing every step marks the unit done, and unticking reopens it', () => {
    let t = defaultTerm()
    const c = t.courses[1].id
    for (const s of t.routine) t = toggleStep(t, c, 1, s.id, '2026-10-02')
    expect(getUnit(t, c, 1)).toMatchObject({ done: true, doneOn: '2026-10-02' })
    t = toggleStep(t, c, 1, t.routine[0].id, '2026-10-03')
    expect(getUnit(t, c, 1).done).toBe(false)
  })
  it('marking done directly then toggling a step does not reopen it', () => {
    let t = defaultTerm()
    const c = t.courses[1].id
    t = setUnitDone(t, c, 1, true, '2026-10-02')
    t = toggleStep(t, c, 1, t.routine[0].id, '2026-10-02')
    expect(getUnit(t, c, 1).done).toBe(true)
  })
  it('toggles busy days', () => {
    let t = toggleBusy(defaultTerm(), '2026-10-02')
    expect(t.busyDays['2026-10-02']).toBe(true)
    t = toggleBusy(t, '2026-10-02')
    expect(t.busyDays).toEqual({})
  })
  it('fresh term keeps courses but drops progress and gets new ids', () => {
    const prev = defaultTerm()
    const f = freshTerm(prev, '2027-02-01')
    expect(f.courses.map((c) => c.code)).toEqual(prev.courses.map((c) => c.code))
    expect(f.courses[0].id).not.toBe(prev.courses[0].id)
    expect(f.units).toEqual({})
    expect(f.startDate).toBe('2027-02-01')
  })
})

describe('backup', () => {
  it('round-trips all terms including archived ones', () => {
    const a = { ...defaultTerm(), archivedAt: '2026-11-20' }
    const b = defaultTerm()
    const data = { version: 1 as const, currentTermId: b.id, terms: [a, b] }
    const r = parseImport(exportJson(data))
    expect(r.ok && r.data).toEqual(data)
  })
  it('rejects bad files without throwing', () => {
    expect(parseImport('nope').ok).toBe(false)
    expect(parseImport('{"version":2,"terms":[]}').ok).toBe(false)
    expect(parseImport('{"version":1,"terms":[{"id":1}]}').ok).toBe(false)
  })
})

describe('celebration levels', () => {
  const finish = (t: ReturnType<typeof defaultTerm>, ci: number, w: number) => setUnitDone(t, t.courses[ci].id, w, true, '2026-10-02')
  it('is a unit pop-up mid-course, a course pop-up on the last week, and an all-done pop-up at the end', async () => {
    const { describeDone } = await import('./useCelebration')
    let t = defaultTerm()
    t = finish(t, 1, 1)
    expect(describeDone(t, `${t.courses[1].id}:1`)?.info.level).toBe('unit')
    for (const w of [2, 3, 4]) t = finish(t, 1, w)
    expect(describeDone(t, `${t.courses[1].id}:4`)?.info.level).toBe('course')
    for (let ci = 0; ci < 6; ci++) for (let w = 1; w <= 4; w++) t = finish(t, ci, w)
    expect(describeDone(t, `${t.courses[5].id}:4`)?.info.level).toBe('all')
  })
})
