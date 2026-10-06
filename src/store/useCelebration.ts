import { useEffect, useRef, useState } from 'react'
import type { CelebrationInfo } from '../components/Celebration'
import { ASSESSMENT_LABELS, caState } from '../logic/assessment'
import { courseProgress, nextUnit, progressCounts, topicOf, type UnitRef } from '../logic/units'
import type { Term } from '../types'

const doneKeys = (t: Term) => new Set(Object.entries(t.units).filter(([, u]) => u.done).map(([k]) => k))

export function describeDone(t: Term, key: string): { info: CelebrationInfo; next: UnitRef | null } | null {
  const [courseId, weekStr] = key.split(':')
  const course = t.courses.find((c) => c.id === courseId)
  const week = Number(weekStr)
  if (!course || !(week >= 1 && week <= course.weeks)) return null
  const { done, total, remaining } = progressCounts(t)
  const next = nextUnit(t)
  const nextLabel = next ? `Next: ${next.course.code}, ${t.unitLabel} ${next.week}` : undefined
  const unit = t.unitLabel.toLowerCase()

  if (remaining === 0) {
    return {
      next,
      info: {
        level: 'all',
        title: 'Every unit is done.',
        body: `All ${total} units finished. Nicely done.`,
      },
    }
  }
  if (courseProgress(t, course).done === course.weeks) {
    const waiting = course.assessment && caState(t, course) === 'ready' ? ASSESSMENT_LABELS[course.assessment.type] : undefined
    return {
      next,
      info: {
        level: 'course',
        title: `${course.code} is finished.`,
        body: `Every ${unit} of ${course.title || course.code} is done. ${done} of ${total} units complete.${
          waiting ? ` Your ${waiting} is ready. Take it while it is fresh.` : ''
        }`,
        nextLabel,
        assessmentCourseId: waiting ? course.id : undefined,
        assessmentLabel: waiting,
      },
    }
  }
  const topic = topicOf(course, week)
  return {
    next,
    info: {
      level: 'unit',
      title: `${t.unitLabel} ${week} is done.`,
      body: `${course.code}${topic ? `, ${topic}` : ''}. ${done} of ${total} units complete.`,
      nextLabel,
    },
  }
}

/** Watches the active term and returns a celebration when a unit newly becomes done. */
export function useCelebration(term: Term | null) {
  const prev = useRef<{ id: string; keys: Set<string> } | null>(null)
  const [shown, setShown] = useState<{ info: CelebrationInfo; next: UnitRef | null } | null>(null)

  useEffect(() => {
    if (!term) {
      prev.current = null
      return
    }
    const keys = doneKeys(term)
    const before = prev.current
    prev.current = { id: term.id, keys }
    if (!before || before.id !== term.id) return
    const added = [...keys].filter((k) => !before.keys.has(k))
    if (added.length === 1) {
      const d = describeDone(term, added[0])
      if (d) setShown(d)
    }
  }, [term])

  return { shown, dismiss: () => setShown(null) }
}
