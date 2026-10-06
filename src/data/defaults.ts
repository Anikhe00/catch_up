import type { AppData, Term } from '../types'
import { unitKey } from '../logic/units'

const id = () => crypto.randomUUID()

/** Pre-filled setup data only. Nothing in the logic depends on these values. */
export function defaultTerm(): Term {
  const courses = [
    ['MIT 8101', 'Information Technology Management'],
    ['MIT 8103', 'Advanced Database Systems'],
    ['MIT 8105', 'Network Architecture and Protocols'],
    ['MIT 8107', 'Software Development Lifecycle'],
    ['MIT 8111', 'Ethics and Legal Issues in Information Technology'],
    ['MIT 8113', 'Digital Transformation and Innovation'],
  ].map(([code, title]) => ({ id: id(), code, title, weeks: 4 }))

  return {
    id: id(),
    name: 'MSc Semester 1 CA',
    unitLabel: 'Week',
    studyStyle: 'focus',
    startDate: '2026-10-01',
    targetDate: '2026-10-31',
    deadlineDate: '2026-11-14',
    courses,
    routine: [
      'Upload the lecture material to NotebookLM',
      'Listen to the audio overview',
      'Take the quiz',
      'Write 3 key points',
    ].map((label) => ({ id: id(), label })),
    units: {
      [unitKey(courses[0].id, 1)]: { done: true, steps: {}, keyPoints: '', unclear: '' },
    },
    busyDays: {},
  }
}

export const emptyAppData = (): AppData => ({ version: 1, currentTermId: null, terms: [] })
