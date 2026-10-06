import { useState } from 'react'
import { Button, Card, Switch } from '../components/ui'
import { Says, type Mood } from '../components/Mascot'
import { ASSESSMENT_LABELS, caState, closesOn, readyAssessments, upcomingAssessments } from '../logic/assessment'
import { formatDate } from '../logic/dates'
import { computePace, type Pace } from '../logic/pace'
import { courseSlots } from '../logic/plan'
import { getUnit, nextUnit, studyOrder, studyStyle, isDone, topicOf, type UnitRef } from '../logic/units'
import { toggleBusy } from '../store/actions'
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

function closing(daysLeft: number, on: string): string {
  if (daysLeft < 0) return `The window closed on ${formatDate(on)}. It may still be worth checking.`
  if (daysLeft === 0) return 'Closes today.'
  if (daysLeft === 1) return 'Closes tomorrow.'
  return `Closes in ${daysLeft} days, on ${formatDate(on)}.`
}

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

function paceLine(p: Pace): string {
  if (p.status.kind === 'behind')
    return `${units(p.status.units)} behind. Today's target already takes that into account.`
  if (p.status.kind === 'ahead')
    return `${units(p.status.units)} ahead. You can bank the extra time for your assessments.`
  return 'On track.'
}

export function Today({
  term,
  today,
  pick,
  onPick,
  onOpen,
  onOpenCA,
}: {
  term: Term
  today: string
  pick: UnitRef | null
  onPick: (r: UnitRef | null) => void
  onOpen: (r: UnitRef) => void
  onOpenCA: (courseId: string) => void
}) {
  const { updateTerm } = useAppData()
  const [choosing, setChoosing] = useState(false)
  const pace = computePace(term, today)

  const open = studyOrder(term).filter((u) => !isDone(term, u))
  const picked = pick && open.find((u) => u.course.id === pick.course.id && u.week === pick.week)
  const suggested = picked ?? nextUnit(term)
  const final = pace.phase === 'final'
  const allDone = pace.remaining === 0
  const pendingCAs = term.courses.filter((c) => c.assessment && !c.assessment.takenOn).length

  const mood: Mood = allDone
    ? 'party'
    : pace.isBusyToday
      ? 'sleepy'
      : pace.status.kind === 'ahead' || (pace.doneToday > 0 && pace.doneToday >= pace.todayUnits)
        ? 'happy'
        : 'calm'

  const focus = studyStyle(term) === 'focus'
  const slot = suggested && focus ? courseSlots(term, today).find((sl) => sl.course.id === suggested.course.id) : undefined
  const ready = readyAssessments(term)
  const upcoming = upcomingAssessments(term, today)

  const stepsDone = suggested
    ? term.routine.filter((s) => getUnit(term, suggested.course.id, suggested.week).steps[s.id]).length
    : 0

  return (
    <main className="rise mx-auto max-w-md px-5 pb-28 pt-8">
      <div>
        <p className="text-sm font-bold text-soft">{term.name}</p>
        <h1 className="squiggle text-3xl font-semibold">{final ? 'The final stretch' : 'Today'}</h1>
      </div>

      <div className="mt-4">
        <Says mood={mood} quips={QUIPS}>
          <p className="font-display text-lg font-semibold">
            {allDone ? (pendingCAs ? 'All the units are done.' : 'Everything is done.') : `${greeting()}.`}
          </p>
          <p className="text-soft" aria-live="polite">
            {allDone
              ? pendingCAs
                ? 'Take your remaining assessments while it is all fresh.'
                : 'Nothing is left on your list. Rest well.'
              : final
                ? `The study target date has passed. ${units(pace.remaining)} still open before the deadline.`
                : paceLine(pace)}
          </p>
        </Says>
      </div>

      <div className="mt-6 flex gap-3">
        {!final && <Countdown label="To study target" n={pace.daysToTarget} tilt="tilt-l" />}
        <Countdown label="To final deadline" n={pace.daysToDeadline} tilt="tilt-r" />
      </div>

      {upcoming.length > 0 && (
        <Card className="mt-8">
          <p className="text-sm font-bold text-soft">Coming up</p>
          <ul className="mt-2 space-y-3">
            {upcoming.map((u) => (
              <li key={u.course.id}>
                <p className="font-bold">{u.course.code}: {ASSESSMENT_LABELS[u.course.assessment!.type]}</p>
                <p className="text-soft">
                  {closing(u.daysLeft, closesOn(term, u.course))}
                  {u.unitsLeft > 0 && ` ${units(u.unitsLeft)} left to study first.`}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {ready.map((c) => (
        <Card key={c.id} className="mt-8 bg-accent-soft">
          <p className="text-sm font-bold text-soft">Ready to take</p>
          <p className="mt-1 font-display text-2xl font-semibold">{c.code}: {ASSESSMENT_LABELS[c.assessment!.type]}</p>
          <p className="text-soft">
            Every {term.unitLabel.toLowerCase()} is done, so this is the best time to take it.
            {` Closes on ${formatDate(closesOn(term, c))}.`}
          </p>
          <Button variant="primary" className="mt-4 w-full" onClick={() => onOpenCA(c.id)}>Record it</Button>
        </Card>
      ))}

      {!allDone && suggested && (
        <Card className="mt-8">
          <p className="text-sm font-bold text-soft">{final ? 'Still open' : "Today's unit"}</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {suggested.course.code}, {term.unitLabel} {suggested.week}
          </p>
          {topicOf(suggested.course, suggested.week) && (
            <p className="mt-1 font-bold">{topicOf(suggested.course, suggested.week)}</p>
          )}
          <p className="text-soft">{suggested.course.title}</p>
          {focus && !final && (
            <p className="mt-3 rounded-2xl bg-accent-soft px-4 py-2 text-sm">
              {slot ? `Aim to finish ${suggested.course.code} by ${formatDate(slot.endDate)}` : `Studying ${suggested.course.code}`}
              {suggested.course.assessment && caState(term, suggested.course) !== 'taken'
                ? `, then take the ${ASSESSMENT_LABELS[suggested.course.assessment.type]}.`
                : '.'}
            </p>
          )}
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

      {!final && !allDone && (
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

    </main>
  )
}
