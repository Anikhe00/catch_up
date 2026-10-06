import { useState } from 'react'
import { ASSESSMENT_LABELS, ASSESSMENT_TYPES } from '../logic/assessment'
import { formatDate } from '../logic/dates'
import type { AssessmentType, Course } from '../types'
import { Mascot } from './Mascot'
import { Sheet } from './Sheet'
import { Button, Field, IconButton, inputClass } from './ui'

function summary(c: Course, manual: boolean): string {
  const set = Array.from({ length: c.weeks }, (_, i) => (c.topics?.[i] ?? '').trim()).filter(Boolean).length
  const ca = c.assessment ? ` · ${ASSESSMENT_LABELS[c.assessment.type]}` : ''
  const by = manual && c.finishBy ? ` · finish by ${formatDate(c.finishBy)}` : ''
  return `${c.weeks} week${c.weeks === 1 ? '' : 's'} · ${set} of ${c.weeks} planned${ca}${by}`
}

/** A compact course list. Each course opens in a panel for its details and weekly topics. */
export function CoursesEditor({
  courses,
  onChange,
  unitLabel,
  manualDates = false,
}: {
  courses: Course[]
  onChange: (c: Course[]) => void
  unitLabel: string
  /** Show a finish-by date for each course. */
  manualDates?: boolean
}) {
  const [editId, setEditId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const idx = courses.findIndex((c) => c.id === editId)
  const course = idx >= 0 ? courses[idx] : null
  const label = unitLabel.trim() || 'Unit'

  const patch = (p: Partial<Course>) => onChange(courses.map((c, i) => (i === idx ? { ...c, ...p } : c)))
  const setTopic = (week: number, text: string) => {
    const topics = Array.from({ length: Math.max(course!.weeks, course!.topics?.length ?? 0) }, (_, i) => course!.topics?.[i] ?? '')
    topics[week - 1] = text
    patch({ topics })
  }
  const move = (d: -1 | 1) => {
    const next = [...courses]
    ;[next[idx], next[idx + d]] = [next[idx + d], next[idx]]
    onChange(next)
  }
  const close = () => {
    setEditId(null)
    setConfirmRemove(false)
  }
  const add = () => {
    const c: Course = { id: crypto.randomUUID(), code: '', title: '', weeks: 4, topics: [] }
    onChange([...courses, c])
    setEditId(c.id)
  }

  return (
    <>
      {courses.length === 0 && (
        <div className="flex items-center gap-3 py-2">
          <Mascot mood="sleepy" size={64} still />
          <p className="text-soft">No courses yet. Add your first one below.</p>
        </div>
      )}
      {courses.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setEditId(c.id)}
          className="sticker flex w-full items-center gap-3 rounded-3xl bg-surface p-4 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{c.code.trim() || 'New course'}</span>
            <span className="block truncate text-soft">{c.title.trim() || 'Add a title'}</span>
            <span className="mt-1 block text-sm text-soft">{summary(c, manualDates)}</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent">Edit</span>
        </button>
      ))}
      <Button className="w-full border-dashed" onClick={add}>Add a course</Button>

      {course && (
        <Sheet title="Edit course" onClose={close}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{course.code.trim() || 'New course'}</h2>
            <Button variant="primary" onClick={close}>Done</Button>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Course code">
              <input className={inputClass} value={course.code} placeholder="MIT 8101" onChange={(e) => patch({ code: e.target.value })} />
            </Field>
            <Field label="Course title">
              <input className={inputClass} value={course.title} placeholder="Information Technology Management" onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between">
              <span className="font-bold text-soft">How many {label.toLowerCase()}s</span>
              <div className="flex items-center">
                <IconButton label="Fewer" disabled={course.weeks <= 1} onClick={() => patch({ weeks: course.weeks - 1 })}>−</IconButton>
                <span className="w-8 text-center text-lg" aria-live="polite">{course.weeks}</span>
                <IconButton label="More" disabled={course.weeks >= 20} onClick={() => patch({ weeks: course.weeks + 1 })}>+</IconButton>
              </div>
            </div>
          </div>

          {manualDates && (
            <div className="mt-4">
              <Field label="Finish this course by (optional)">
                <input
                  type="date"
                  className={inputClass}
                  value={course.finishBy ?? ''}
                  onChange={(e) => patch({ finishBy: e.target.value || undefined })}
                />
              </Field>
            </div>
          )}

          <h3 className="mt-8 text-lg font-semibold">Assessment</h3>
          <p className="text-sm text-soft">The graded piece for this course. You will be nudged to take it once the units are done.</p>
          <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Assessment type">
            {([undefined, ...ASSESSMENT_TYPES] as (AssessmentType | undefined)[]).map((t) => {
              const on = course.assessment?.type === t
              return (
                <button
                  key={t ?? 'none'}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => patch({ assessment: t ? { ...course.assessment, type: t } : undefined })}
                  className={`min-h-12 rounded-2xl border-2 px-3 text-sm font-bold ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'}`}
                >
                  {t ? ASSESSMENT_LABELS[t] : 'None'}
                </button>
              )
            })}
          </div>
          {course.assessment && (
            <div className="mt-3">
              <Field label="Closes on (optional, defaults to your final deadline)">
                <input
                  type="date"
                  className={inputClass}
                  value={course.assessment.closes ?? ''}
                  onChange={(e) => patch({ assessment: { ...course.assessment!, closes: e.target.value || undefined } })}
                />
              </Field>
            </div>
          )}

          <h3 className="mt-8 text-lg font-semibold">What to study each {label.toLowerCase()}</h3>
          <p className="text-sm text-soft">Optional. This shows up on Today so you know what you are opening.</p>
          <div className="mt-3 space-y-3">
            {Array.from({ length: course.weeks }, (_, i) => i + 1).map((w) => (
              <label key={w} className="block">
                <span className="mb-1 block text-sm font-bold text-soft">{label} {w}</span>
                <input
                  className={inputClass}
                  value={course.topics?.[w - 1] ?? ''}
                  placeholder={w === 1 ? 'Introduction to information technology' : 'Topic'}
                  onChange={(e) => setTopic(w, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="mt-8 border-t-2 border-line pt-4">
            <div className="flex gap-2">
              <Button className="flex-1" disabled={idx === 0} onClick={() => move(-1)}>Move earlier</Button>
              <Button className="flex-1" disabled={idx === courses.length - 1} onClick={() => move(1)}>Move later</Button>
            </div>
            {!confirmRemove ? (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setConfirmRemove(true)}>Remove this course</Button>
            ) : (
              <div className="mt-3 rounded-2xl bg-accent-soft p-4">
                <p>Remove {course.code.trim() || 'this course'} and its progress?</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      onChange(courses.filter((c) => c.id !== course.id))
                      close()
                    }}
                  >
                    Remove
                  </Button>
                  <Button className="flex-1" onClick={() => setConfirmRemove(false)}>Keep it</Button>
                </div>
              </div>
            )}
          </div>
        </Sheet>
      )}
    </>
  )
}
