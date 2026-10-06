import { useEffect, useRef } from 'react'
import { Mascot } from './Mascot'
import { Sparkles } from './Sparkles'
import { Button } from './ui'

export interface CelebrationInfo {
  level: 'unit' | 'course' | 'all'
  title: string
  body: string
  /** Label for the button that opens whatever comes next, if anything does. */
  nextLabel?: string
  /** Set when a course finished and its assessment is waiting. */
  assessmentCourseId?: string
  assessmentLabel?: string
}

/** A pop-up that marks a finished unit, course, or the whole plan. */
export function Celebration({
  info,
  onNext,
  onAssessment,
  onToday,
  onClose,
}: {
  info: CelebrationInfo
  onNext: () => void
  onAssessment: (courseId: string) => void
  onToday: () => void
  onClose: () => void
}) {
  const first = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const big = info.level !== 'unit'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label={info.title}>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 min-h-0 cursor-default bg-black/50" />
      <div className="celebrate sticker relative w-full max-w-sm rounded-[2rem] bg-bg px-6 pb-6 pt-8 text-center">
        <Sparkles big />
        <div className="flex justify-center">
          <Mascot mood="party" size={big ? 132 : 112} />
        </div>
        <h2 className="mt-3 text-2xl font-semibold">{info.title}</h2>
        <p className="mt-2 text-soft">{info.body}</p>
        <div className="mt-6 space-y-2">
          {info.assessmentCourseId ? (
            <>
              <Button ref={first} variant="primary" className="w-full" onClick={() => onAssessment(info.assessmentCourseId!)}>
                Record my {info.assessmentLabel}
              </Button>
              {info.nextLabel && <Button className="w-full" onClick={onNext}>{info.nextLabel}</Button>}
              <Button variant="ghost" className="w-full" onClick={onToday}>Back to Today</Button>
            </>
          ) : info.nextLabel ? (
            <>
              <Button ref={first} variant="primary" className="w-full" onClick={onNext}>{info.nextLabel}</Button>
              <Button className="w-full" onClick={onToday}>Back to Today</Button>
            </>
          ) : (
            <Button ref={first} variant="primary" className="w-full" onClick={onToday}>Back to Today</Button>
          )}
        </div>
      </div>
    </div>
  )
}
