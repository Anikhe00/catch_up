import { useState } from 'react'
import { Button, Card, ProgressBar } from '../components/ui'
import { Says } from '../components/Mascot'
import { ASSESSMENT_LABELS } from '../logic/assessment'
import { formatDate } from '../logic/dates'
import { courseProgress, progressCounts } from '../logic/units'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'

const fmt = (d: string) => formatDate(d, true)

function Archived({ term }: { term: Term }) {
  const [open, setOpen] = useState(false)
  const { done, total } = progressCounts(term)
  return (
    <Card>
      <button type="button" className="w-full text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <p className="font-display text-xl font-semibold">{term.name || 'Untitled term'}</p>
        <p className="text-sm text-soft">
          {fmt(term.startDate)} to {fmt(term.deadlineDate)}
        </p>
        <p className="mt-2">{done} of {total} units done</p>
      </button>
      <div className="mt-2"><ProgressBar done={done} total={total} label={`${term.name} progress`} /></div>
      {open && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {term.courses.map((c) => {
            const p = courseProgress(term, c)
            return (
              <li key={c.id}>
                <div className="flex justify-between gap-3">
                  <span>{c.code} {c.title}</span>
                  <span className="shrink-0 text-soft">{p.done} of {p.total}</span>
                </div>
                {c.assessment && (
                  <p className="text-soft">
                    {ASSESSMENT_LABELS[c.assessment.type]}:{' '}
                    {c.assessment.takenOn
                      ? `taken ${formatDate(c.assessment.takenOn)}${c.assessment.score ? `, ${c.assessment.score}` : ''}`
                      : 'not taken'}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function History({ onNewTerm }: { onNewTerm: () => void }) {
  const { data, term } = useAppData()
  const [confirm, setConfirm] = useState(false)
  const archived = data.terms.filter((t) => t.archivedAt).sort((a, b) => (b.archivedAt! > a.archivedAt! ? 1 : -1))

  return (
    <main className="mx-auto max-w-md px-5 pb-28 pt-10">
      <h1 className="squiggle text-3xl font-semibold">History</h1>

      {term && (
        <Card className="mt-6">
          <p className="font-medium">Finished with {term.name}?</p>
          <p className="mt-1 text-sm text-soft">
            It moves here as a read-only record and you start a fresh setup. Your courses carry over so you can edit them.
          </p>
          {!confirm ? (
            <Button className="mt-4 w-full" onClick={() => setConfirm(true)}>Start a new term</Button>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button variant="primary" className="flex-1" onClick={onNewTerm}>Archive and start</Button>
              <Button className="flex-1" onClick={() => setConfirm(false)}>Cancel</Button>
            </div>
          )}
        </Card>
      )}

      <div className="mt-8 space-y-4">
        {archived.length === 0 ? (
          <Says mood="sleepy">
            <p className="font-display text-lg font-semibold">Nothing here yet.</p>
            <p className="text-soft">Finished terms settle in here once you archive one.</p>
          </Says>
        ) : (
          archived.map((t) => <Archived key={t.id} term={t} />)
        )}
      </div>
    </main>
  )
}
