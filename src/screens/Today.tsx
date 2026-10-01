import { useState } from 'react'
import { Button, Card, Check, Switch } from '../components/ui'
import { Says, type Mood } from '../components/Mascot'
import { computePace, type Pace } from '../logic/pace'
import { getUnit, nextUnit, orderedUnits, isDone, topicOf, type UnitRef } from '../logic/units'
import { setWriting, toggleBusy } from '../store/actions'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'

const days = (n: number) => (n === 0 ? 'Today' : n === 1 ? '1 day' : `${n} days`)
const units = (n: number) => `${n} unit${n === 1 ? '' : 's'}`

function Countdown({ label, n, tilt }: { label: string; n: number; tilt: string }) {
  return (
    <div className={`sticker flex-1 rounded-3xl bg-surface px-4 py-3 ${tilt}`}>
      <p className="text-sm font-bold text-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{n < 0 ? 'Passed' : days(n)}</p>
    </div>
  )
}

const QUIPS = [
  'Small steps still count.',
  'One unit at a time.',
  'Water counts as study equipment.',
  'You do not have to feel ready to begin.',
  'Snack first, if that helps.',
  'Pip believes in a short break.',
]

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function paceLine(p: Pace): string {
  if (p.status.kind === 'behind')
    return `${units(p.status.units)} behind. Today's target already takes that into account.`
  if (p.status.kind === 'ahead')
    return `${units(p.status.units)} ahead. You can bank the extra time for writing.`
  return 'On track.'
}

function WritingList({ term }: { term: Term }) {
  const { updateTerm } = useAppData()
  const [draft, setDraft] = useState('')
  const set = (writing: Term['writing']) => updateTerm((t) => setWriting(t, writing))
  const add = () => {
    if (!draft.trim()) return
    set([...term.writing, { id: crypto.randomUUID(), label: draft.trim(), done: false }])
    setDraft('')
  }
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold">Writing</h2>
      <div className="mt-3 space-y-2">
        {term.writing.map((w) => (
          <div key={w.id} className="flex items-center gap-1">
            <div className="flex-1">
              <Check checked={w.done} onChange={() => set(term.writing.map((x) => (x.id === w.id ? { ...x, done: !x.done } : x)))}>
                {w.label}
              </Check>
            </div>
            <button
              type="button"
              aria-label={`Remove ${w.label}`}
              className="h-12 w-12 shrink-0 rounded-xl text-soft hover:bg-accent-soft"
              onClick={() => set(term.writing.filter((x) => x.id !== w.id))}
            >
              ✕
            </button>
          </div>
        ))}
        <form
          className="flex gap-2 pt-1"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <input
            aria-label="New writing task"
            placeholder="Add a writing task"
            className="w-full rounded-2xl border-2 border-line bg-surface px-4"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>
      </div>
    </div>
  )
}

export function Today({
  term,
  today,
  pick,
  onPick,
  onOpen,
}: {
  term: Term
  today: string
  pick: UnitRef | null
  onPick: (r: UnitRef | null) => void
  onOpen: (r: UnitRef) => void
}) {
  const { updateTerm } = useAppData()
  const [choosing, setChoosing] = useState(false)
  const pace = computePace(term, today)

  const open = orderedUnits(term).filter((u) => !isDone(term, u))
  const picked = pick && open.find((u) => u.course.id === pick.course.id && u.week === pick.week)
  const suggested = picked ?? nextUnit(term)
  const writing = pace.phase === 'writing'
  const allDone = pace.remaining === 0

  const mood: Mood = allDone
    ? 'party'
    : pace.isBusyToday
      ? 'sleepy'
      : pace.status.kind === 'ahead' || (pace.doneToday > 0 && pace.doneToday >= pace.todayUnits)
        ? 'happy'
        : 'calm'

  const stepsDone = suggested
    ? term.routine.filter((s) => getUnit(term, suggested.course.id, suggested.week).steps[s.id]).length
    : 0

  return (
    <main className="rise mx-auto max-w-md px-5 pb-28 pt-8">
      <div>
        <p className="text-sm font-bold text-soft">{term.name}</p>
        <h1 className="squiggle text-3xl font-semibold">{writing ? 'Writing time' : 'Today'}</h1>
      </div>

      <div className="mt-4">
        <Says mood={mood} quips={QUIPS}>
          <p className="font-display text-lg font-semibold">{allDone ? 'All the units are done.' : `${greeting()}.`}</p>
          <p className="text-soft" aria-live="polite">
            {allDone
              ? 'The rest of your time is for writing.'
              : writing
                ? 'The study target date has passed. Writing comes next.'
                : paceLine(pace)}
          </p>
        </Says>
      </div>

      <div className="mt-6 flex gap-3">
        {!writing && <Countdown label="To study target" n={pace.daysToTarget} tilt="tilt-l" />}
        <Countdown label="To final deadline" n={pace.daysToDeadline} tilt="tilt-r" />
      </div>

      {!allDone && suggested && (
        <Card className="mt-8">
          <p className="text-sm font-bold text-soft">{writing ? 'Still open' : "Today's unit"}</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {suggested.course.code}, {term.unitLabel} {suggested.week}
          </p>
          {topicOf(suggested.course, suggested.week) && (
            <p className="mt-1 font-bold">{topicOf(suggested.course, suggested.week)}</p>
          )}
          <p className="text-soft">{suggested.course.title}</p>
          {stepsDone > 0 && (
            <p className="mt-2 text-sm text-soft">
              {stepsDone} of {term.routine.length} steps done
            </p>
          )}
          <Button variant="primary" className="mt-5 w-full" onClick={() => onOpen(suggested)}>
            {stepsDone > 0 ? 'Continue' : 'Start'}
          </Button>
          <Button variant="ghost" className="mt-1 w-full" onClick={() => setChoosing((c) => !c)} aria-expanded={choosing}>
            Pick a different unit
          </Button>
          {choosing && (
            <ul className="mt-2 space-y-1 border-t border-line pt-2">
              {open.map((u) => (
                <li key={`${u.course.id}:${u.week}`}>
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left hover:bg-accent-soft"
                    onClick={() => {
                      onPick(u)
                      setChoosing(false)
                    }}
                  >
                    <span>
                      {u.course.code}, {term.unitLabel} {u.week}
                      {topicOf(u.course, u.week) && <span className="block text-sm text-soft">{topicOf(u.course, u.week)}</span>}
                    </span>
                    {u === suggested && <span className="shrink-0 text-sm text-soft">Suggested</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {picked && (
            <Button variant="ghost" className="mt-1 w-full" onClick={() => onPick(null)}>
              Back to the suggestion
            </Button>
          )}
        </Card>
      )}

      {!writing && !allDone && (
        <div className="mt-8 space-y-4">
          <p>
            {pace.doneToday >= pace.todayUnits && pace.doneToday > 0
              ? `Today's target is met with ${units(pace.doneToday)} done.`
              : `Today's target: ${units(pace.todayUnits)}.`}
            {pace.isBusyToday && <span className="text-soft"> Lighter, because it's a busy day.</span>}
          </p>
          <Card className="py-2">
            <Switch
              checked={pace.isBusyToday}
              onChange={() => updateTerm((t) => toggleBusy(t, today))}
              label="Busy day"
            />
          </Card>
        </div>
      )}

      {writing && !allDone && (
        <p className="mt-8 text-soft">
          {units(pace.remaining)} still open from the study plan. Finish them whenever you can, then focus on writing.
        </p>
      )}

      {(writing || allDone) && <WritingList term={term} />}
    </main>
  )
}
