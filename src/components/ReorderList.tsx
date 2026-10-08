import { useRef } from 'react'
import type { Course } from '../types'

/** Courses in study order with up and down buttons. Arrows are more dependable than dragging on a phone. */
export function ReorderList({
  courses,
  onChange,
  meta,
}: {
  courses: Course[]
  onChange: (c: Course[]) => void
  meta?: (c: Course) => string
}) {
  const refocus = useRef<string | null>(null)

  const move = (i: number, d: -1 | 1) => {
    const next = [...courses]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    refocus.current = `${courses[i].id}:${d === -1 ? 'up' : 'down'}`
    onChange(next)
    // Moving a row can drop focus, so put it back on the same button.
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-move="${refocus.current}"]`)?.focus()
    })
  }

  const arrow = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-line text-lg disabled:opacity-30'

  return (
    <ol className="space-y-2">
      {courses.map((c, i) => (
        <li key={c.id} className="sticker flex items-center gap-2 rounded-3xl bg-surface py-2 pl-4 pr-2">
          <span className="w-5 text-center font-display text-lg font-semibold text-soft" aria-hidden="true">{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">{c.code.trim() || 'New course'}</span>
            <span className="block truncate text-sm text-soft">{meta ? meta(c) : c.title}</span>
          </span>
          <button
            type="button"
            data-move={`${c.id}:up`}
            aria-label={`Move ${c.code || 'course'} earlier`}
            disabled={i === 0}
            onClick={() => move(i, -1)}
            className={arrow}
          >
            ↑
          </button>
          <button
            type="button"
            data-move={`${c.id}:down`}
            aria-label={`Move ${c.code || 'course'} later`}
            disabled={i === courses.length - 1}
            onClick={() => move(i, 1)}
            className={arrow}
          >
            ↓
          </button>
        </li>
      ))}
    </ol>
  )
}
