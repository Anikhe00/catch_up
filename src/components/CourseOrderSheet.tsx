import { caState } from '../logic/assessment'
import { courseProgress } from '../logic/units'
import { useAppData } from '../store/AppDataContext'
import type { Term } from '../types'
import { ReorderList } from './ReorderList'
import { Sheet } from './Sheet'
import { Button } from './ui'

/** Change the order you take courses in. Applies straight away. */
export function CourseOrderSheet({ term, onClose }: { term: Term; onClose: () => void }) {
  const { updateTerm } = useAppData()
  const meta = (c: Term['courses'][number]) => {
    const p = courseProgress(term, c)
    const state = caState(term, c)
    const ca = state === 'taken' ? ' · assessment taken' : state === 'ready' ? ' · assessment ready' : ''
    return `${p.done} of ${p.total} done${ca}`
  }
  return (
    <Sheet title="Course order" onClose={onClose}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Course order</h2>
        <Button variant="primary" onClick={onClose}>Done</Button>
      </div>
      <p className="mb-4 mt-2 text-sm text-soft">
        You study the first course that still has units left. Move a course up to take it sooner. Your dates adjust on their own.
      </p>
      <ReorderList courses={term.courses} meta={meta} onChange={(courses) => updateTerm((t) => ({ ...t, courses }))} />
    </Sheet>
  )
}
