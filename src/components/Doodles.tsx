/** Faint floating shapes in the page margins. Decorative only. */
export function Doodles() {
  const c = 'var(--accent)'
  return (
    <div aria-hidden="true" className="doodles pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg className="float absolute right-3 top-24" width="46" height="46" viewBox="0 0 46 46" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 5l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1Z" />
      </svg>
      <svg className="float absolute left-2 top-[38%]" style={{ animationDelay: '-2s' }} width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
        <path d="M20 4v32M4 20h32M9 9l22 22M31 9L9 31" opacity="0.7" />
      </svg>
      <svg className="float absolute right-2 top-[58%]" style={{ animationDelay: '-4s' }} width="70" height="26" viewBox="0 0 70 26" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round">
        <path d="M3 13q8-14 16 0t16 0 16 0 16 0" />
      </svg>
      <svg className="float absolute bottom-48 right-6" style={{ animationDelay: '-3s' }} width="26" height="26" viewBox="0 0 26 26" fill={c} opacity="0.8">
        <circle cx="13" cy="13" r="6" />
      </svg>
    </div>
  )
}
