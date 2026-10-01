import { useEffect, useRef, type ReactNode } from 'react'

/** A bottom panel that slides up over the page. Closes on Escape or a tap on the backdrop. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close panel" tabIndex={-1} onClick={onClose} className="absolute inset-0 min-h-0 cursor-default bg-black/45" />
      <div
        ref={ref}
        className="sheet relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-2 border-b-0 border-line bg-bg px-5 pb-8 pt-3"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
