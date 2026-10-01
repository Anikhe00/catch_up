import { Button, Card, Check } from '../components/ui'
import { Mascot } from '../components/Mascot'
import { Sparkles } from '../components/Sparkles'
import { getUnit, topicOf } from '../logic/units'
import { setUnitDone, setUnitText, toggleStep } from '../store/actions'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'

export function Routine({
  term,
  courseId,
  week,
  today,
  onBack,
}: {
  term: Term
  courseId: string
  week: number
  today: string
  onBack: () => void
}) {
  const { updateTerm } = useAppData()
  const course = term.courses.find((c) => c.id === courseId)
  if (!course) return null
  const u = getUnit(term, courseId, week)
  const text = (field: 'keyPoints' | 'unclear', v: string) => updateTerm((t) => setUnitText(t, courseId, week, field, v))

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <Button variant="ghost" className="-ml-3" onClick={onBack}>← Back</Button>
      <p className="mt-4 text-sm text-soft">{course.code}</p>
      <h1 className="text-3xl font-semibold">{term.unitLabel} {week}</h1>
      {topicOf(course, week) && <p className="mt-1 text-lg font-bold">{topicOf(course, week)}</p>}
      <p className="text-soft">{course.title}</p>

      {u.done && (
        <Card className="mt-6 bg-accent-soft">
          <div className="relative flex items-center gap-4">
            <Sparkles />
            <Mascot mood="happy" size={72} />
            <p className="font-display text-lg font-semibold">This {term.unitLabel.toLowerCase()} is done.</p>
          </div>
          <Button variant="primary" className="mt-4 w-full" onClick={onBack}>Back</Button>
        </Card>
      )}

      <h2 className="mt-8 font-display text-xl font-semibold">Routine</h2>
      <div className="mt-3 space-y-2">
        {term.routine.map((s) => (
          <Check key={s.id} checked={!!u.steps[s.id]} onChange={() => updateTerm((t) => toggleStep(t, courseId, week, s.id, today))}>
            {s.label}
          </Check>
        ))}
      </div>

      <label className="mt-8 block">
        <span className="font-display text-xl font-semibold">Key points</span>
        <span className="mb-2 block text-sm text-soft">Three things you want to remember.</span>
        <textarea
          rows={5}
          className="w-full rounded-2xl border-2 border-line bg-surface p-4"
          value={u.keyPoints}
          onChange={(e) => text('keyPoints', e.target.value)}
        />
      </label>

      <label className="mt-6 block">
        <span className="font-display text-xl font-semibold">Still unclear</span>
        <span className="mb-2 block text-sm text-soft">Questions to come back to. Optional.</span>
        <textarea
          rows={3}
          className="w-full rounded-2xl border-2 border-line bg-surface p-4"
          value={u.unclear}
          onChange={(e) => text('unclear', e.target.value)}
        />
      </label>

      <Button
        variant={u.done ? 'secondary' : 'primary'}
        className="mt-8 w-full"
        onClick={() => updateTerm((t) => setUnitDone(t, courseId, week, !u.done, today))}
      >
        {u.done ? 'Mark as not done' : 'Mark as done'}
      </Button>
    </main>
  )
}
