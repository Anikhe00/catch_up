import { useState } from 'react'
import { Button, ProgressBar } from '../components/ui'
import { Sheet } from '../components/Sheet'
import { ASSESSMENT_LABELS, caState } from '../logic/assessment'
import { courseProgress, getUnit, progressCounts, topicOf, type UnitRef } from '../logic/units'
import { setUnitDone } from '../store/actions'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'

export function Grid({
  term,
  today,
  onOpen,
  onOpenCA,
}: {
  term: Term
  today: string
  onOpen: (r: UnitRef) => void
  onOpenCA: (courseId: string) => void
}) {
  const { updateTerm } = useAppData()
  const [sel, setSel] = useState<UnitRef | null>(null)
  const { done, total } = progressCounts(term)
  const maxWeeks = Math.max(1, ...term.courses.map((c) => c.weeks))
  const hasCA = term.courses.some((c) => c.assessment)
  const selDone = sel ? getUnit(term, sel.course.id, sel.week).done : false

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <h1 className="squiggle text-3xl font-semibold">Grid</h1>
      <p className="mt-2 text-soft">{done} of {total} units done</p>
      <div className="mt-3"><ProgressBar done={done} total={total} label="Overall progress" /></div>

      <div className="-mx-5 mt-8 overflow-x-auto px-5">
        <table className="border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="text-left text-sm font-normal text-soft"><span className="sr-only">Course</span></th>
              {Array.from({ length: maxWeeks }, (_, i) => (
                <th key={i} className="text-sm font-normal text-soft">{i + 1}</th>
              ))}
              {hasCA && <th className="pl-2 text-sm font-normal text-soft">CA</th>}
            </tr>
          </thead>
          <tbody>
            {term.courses.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="pr-2 text-left text-sm font-medium whitespace-nowrap">{c.code}</th>
                {Array.from({ length: maxWeeks }, (_, i) => {
                  const w = i + 1
                  if (w > c.weeks) return <td key={w} />
                  const isDone = getUnit(term, c.id, w).done
                  const isSel = sel?.course.id === c.id && sel.week === w
                  return (
                    <td key={w}>
                      <button
                        type="button"
                        aria-label={`${c.code}, ${term.unitLabel} ${w}, ${isDone ? 'done' : 'not done'}`}
                        aria-pressed={isSel}
                        onClick={() => setSel(isSel ? null : { course: c, week: w })}
                        className={`h-12 w-12 rounded-2xl border-2 text-lg ${isDone ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'} ${isSel ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}`}
                      >
                        {isDone ? <span className="pop inline-block">★</span> : ''}
                      </button>
                    </td>
                  )
                })}
                {hasCA && (
                  <td className="pl-2">
                    {c.assessment &&
                      (() => {
                        const st = caState(term, c)
                        const styles = {
                          taken: 'border-accent bg-accent text-on-accent',
                          ready: 'border-accent bg-accent-soft text-accent',
                          locked: 'border-dashed border-line bg-surface text-soft',
                          none: '',
                        }[st]
                        return (
                          <button
                            type="button"
                            aria-label={`${c.code}, ${ASSESSMENT_LABELS[c.assessment.type]}, ${st === 'taken' ? 'taken' : st === 'ready' ? 'ready to take' : 'not ready yet'}`}
                            onClick={() => onOpenCA(c.id)}
                            className={`h-12 w-12 rounded-2xl border-2 text-sm font-bold ${styles}`}
                          >
                            {st === 'taken' ? <span className="pop inline-block">★</span> : st === 'ready' ? 'Go' : 'CA'}
                          </button>
                        )
                      })()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-soft">Columns are {term.unitLabel.toLowerCase()}s{hasCA ? ', then the course assessment (CA)' : ''}. Tap a square to open it or mark it done.</p>

      {sel && (
        <Sheet title={`${sel.course.code}, ${term.unitLabel} ${sel.week}`} onClose={() => setSel(null)}>
          <p className="text-sm font-bold text-soft">{sel.course.code}</p>
          <h2 className="text-2xl font-semibold">{term.unitLabel} {sel.week}</h2>
          {topicOf(sel.course, sel.week) && <p className="mt-1 font-bold">{topicOf(sel.course, sel.week)}</p>}
          <p className="text-soft">{sel.course.title}</p>
          <p className="mt-2 text-sm text-soft">{selDone ? 'This one is done.' : 'Not done yet.'}</p>
          <div className="mt-5 flex gap-3">
            <Button variant="primary" className="flex-1" onClick={() => { onOpen(sel); setSel(null) }}>Open</Button>
            <Button
              className="flex-1"
              onClick={() => {
                updateTerm((t) => setUnitDone(t, sel.course.id, sel.week, !selDone, today))
                setSel(null)
              }}
            >
              {selDone ? 'Mark not done' : 'Mark done'}
            </Button>
          </div>
        </Sheet>
      )}

      <h2 className="mt-10 text-xl font-semibold">By course</h2>
      <ul className="mt-3 space-y-5">
        {term.courses.map((c) => {
          const p = courseProgress(term, c)
          return (
            <li key={c.id}>
              <div className="flex justify-between gap-3">
                <span>{c.code}</span>
                <span className="text-soft">{p.done} of {p.total}</span>
              </div>
              <p className="mb-2 text-sm text-soft">{c.title}</p>
              <ProgressBar done={p.done} total={p.total} label={`${c.code} progress`} />
            </li>
          )
        })}
      </ul>
    </main>
  )
}
