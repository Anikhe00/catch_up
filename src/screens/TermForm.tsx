import { CoursesEditor } from '../components/CoursesEditor'
import { Field, Section, inputClass } from '../components/ui'
import { isValidDate } from '../logic/dates'
import { unitKey } from '../logic/units'
import type { Term } from '../types'

export function validateTerm(t: Term): string[] {
  const errors: string[] = []
  if (!t.name.trim()) errors.push('Give the term a name.')
  if (t.courses.length === 0) errors.push('Add at least one course.')
  if (t.courses.some((c) => !c.code.trim() && !c.title.trim())) errors.push('Each course needs a code or a title.')
  const dates = [t.startDate, t.targetDate, t.deadlineDate]
  if (!dates.every(isValidDate)) errors.push('Fill in all three dates.')
  else if (!(t.startDate <= t.targetDate && t.targetDate <= t.deadlineDate))
    errors.push('Dates should run in order: start, study target, final deadline.')
  return errors
}


export type FormPart = 'term' | 'dates' | 'courses' | 'done'

/** Errors that block moving on from one setup step. */
export function validatePart(t: Term, part: FormPart): string[] {
  const all = validateTerm(t)
  const keep: Record<FormPart, string[]> = {
    term: ['Give the term a name.'],
    dates: ['Fill in all three dates.', 'Dates should run in order: start, study target, final deadline.'],
    courses: ['Add at least one course.', 'Each course needs a code or a title.'],
    done: [],
  }
  return all.filter((e) => keep[part].includes(e))
}

/** Pass `only` to show one part (setup steps). Leave it out to show everything (Settings). */
export function TermForm({
  t,
  setT,
  showDone,
  only,
}: {
  t: Term
  setT: (fn: (t: Term) => Term) => void
  showDone: boolean
  only?: FormPart
}) {
  const show = (p: FormPart) => !only || only === p
  const label = t.unitLabel.trim() || 'Unit'
  const patch = (p: Partial<Term>) => setT((x) => ({ ...x, ...p }))
  const toggleDone = (courseId: string, week: number) => {
    const k = unitKey(courseId, week)
    const units = { ...t.units }
    if (units[k]?.done) delete units[k]
    else units[k] = { done: true, steps: {}, keyPoints: '', unclear: '' }
    patch({ units })
  }

  return (
    <>
      {show('term') && (
      <Section title={only ? '' : 'Term'}>
        <Field label="Term name">
          <input className={inputClass} value={t.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="What do you call one piece of study?">
          <input
            className={inputClass}
            value={t.unitLabel}
            placeholder="Week, Lecture, Chapter"
            onChange={(e) => patch({ unitLabel: e.target.value })}
          />
        </Field>
        <div>
          <p className="mb-2 text-sm font-bold text-soft">How do you want to study?</p>
          <div className="space-y-2" role="radiogroup" aria-label="Study style">
            {(
              [
                ['focus', 'One course at a time', 'Finish a course, take its assessment while it is fresh, then move on.'],
                ['rotate', 'Rotate through all', 'Every course gets its first unit, then every second unit, and so on.'],
              ] as const
            ).map(([value, title, text]) => {
              const on = (t.studyStyle ?? 'focus') === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => patch({ studyStyle: value })}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
                >
                  <span className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${on ? 'border-accent bg-accent' : 'border-line'}`} aria-hidden="true" />
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="block text-sm text-soft">{text}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        {(t.studyStyle ?? 'focus') === 'focus' && (
          <div>
            <p className="mb-2 text-sm font-bold text-soft">Course dates</p>
            <div className="space-y-2" role="radiogroup" aria-label="Course dates">
              {(
                [
                  ['auto', 'Set automatically', 'The days until your study target date are shared across courses, in order.'],
                  ['manual', 'I will set them', 'Give each course its own finish-by date when you edit it.'],
                ] as const
              ).map(([value, title, text]) => {
                const on = (t.slotMode ?? 'auto') === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => patch({ slotMode: value })}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left ${on ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
                  >
                    <span className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 ${on ? 'border-accent bg-accent' : 'border-line'}`} aria-hidden="true" />
                    <span>
                      <span className="block font-bold">{title}</span>
                      <span className="block text-sm text-soft">{text}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Section>
      )}

      {show('dates') && (
      <Section title={only ? '' : 'Dates'}>
        <Field label="Start date">
          <input type="date" className={inputClass} value={t.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
        </Field>
        <Field label="Study target date (finish all units)">
          <input type="date" className={inputClass} value={t.targetDate} onChange={(e) => patch({ targetDate: e.target.value })} />
        </Field>
        <Field label="Final deadline">
          <input type="date" className={inputClass} value={t.deadlineDate} onChange={(e) => patch({ deadlineDate: e.target.value })} />
        </Field>
      </Section>
      )}

      {show('courses') && (
      <Section title={only ? '' : 'Courses'} hint="Tap a course to edit it and plan what to study each week. Courses are studied in this order.">
        <CoursesEditor courses={t.courses} unitLabel={label} manualDates={(t.studyStyle ?? 'focus') === 'focus' && t.slotMode === 'manual'} onChange={(courses) => patch({ courses })} />
      </Section>
      )}

      {showDone && show('done') && (
      <Section title={only ? '' : 'Already done'} hint={`Tap the ${label.toLowerCase()}s you've finished before starting.`}>
        {t.courses.map((c) => (
          <div key={c.id}>
            <p className="mb-2 text-sm text-soft">{c.code || c.title || 'Untitled course'}</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: c.weeks }, (_, w) => w + 1).map((w) => {
                const on = !!t.units[unitKey(c.id, w)]?.done
                return (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDone(c.id, w)}
                    className={`h-12 min-w-12 rounded-xl border px-3 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-ink'}`}
                  >
                    {w}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </Section>
      )}
    </>
  )
}
