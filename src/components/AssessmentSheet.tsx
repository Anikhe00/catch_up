import { useState } from 'react'
import { ASSESSMENT_LABELS, caState } from '../logic/assessment'
import { formatDate } from '../logic/dates'
import { courseProgress } from '../logic/units'
import { takeAssessment, untakeAssessment } from '../store/actions'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'
import { Mascot } from './Mascot'
import { Sheet } from './Sheet'
import { Button, Field, inputClass } from './ui'

/** Record, review, or undo the assessment for one course. */
export function AssessmentSheet({
  term,
  courseId,
  today,
  onClose,
}: {
  term: Term
  courseId: string
  today: string
  onClose: () => void
}) {
  const { updateTerm } = useAppData()
  const course = term.courses.find((c) => c.id === courseId)
  const a = course?.assessment
  const [score, setScore] = useState(a?.score ?? '')
  if (!course || !a) return null

  const state = caState(term, course)
  const { done, total } = courseProgress(term, course)
  const label = ASSESSMENT_LABELS[a.type]
  const unit = term.unitLabel.toLowerCase()

  const status =
    state === 'taken'
      ? `Taken on ${formatDate(a.takenOn!, true)}.`
      : state === 'ready'
        ? `Every ${unit} is done. This is a good time to take it while it is fresh.`
        : `${total - done} ${unit}${total - done === 1 ? '' : 's'} still to go. If you have already taken it, you can record it now.`

  return (
    <Sheet title={`${course.code} ${label}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        <Mascot mood={state === 'taken' ? 'happy' : 'calm'} size={64} still />
        <div className="min-w-0">
          <p className="text-sm font-bold text-soft">{course.code}</p>
          <h2 className="text-2xl font-semibold">{label}</h2>
        </div>
      </div>
      <p className="mt-1 text-soft">{course.title}</p>
      {a.closes && <p className="mt-2 text-sm font-bold">Closes on {formatDate(a.closes, true)}</p>}
      <p className="mt-3">{status}</p>

      <div className="mt-5">
        <Field label="Score (optional)">
          <input className={inputClass} value={score} placeholder="8/10, 80%, or Pass" onChange={(e) => setScore(e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 space-y-2">
        {state === 'taken' ? (
          <>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                updateTerm((t) => takeAssessment(t, course.id, a.takenOn!, score))
                onClose()
              }}
            >
              Save score
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                updateTerm((t) => untakeAssessment(t, course.id))
                onClose()
              }}
            >
              Mark as not taken
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              updateTerm((t) => takeAssessment(t, course.id, today, score))
              onClose()
            }}
          >
            I have taken it
          </Button>
        )}
      </div>
    </Sheet>
  )
}
