import { useRef, useState } from 'react'
import { useWhimsy } from '../store/whimsy'

export type Mood = 'calm' | 'sleepy' | 'happy' | 'party'

/** Pip, a small blue blob who keeps you company. Purely decorative. */
export function Mascot({ mood = 'calm', size = 88, still = false }: { mood?: Mood; size?: number; still?: boolean }) {
  const face = 'var(--text)'
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 ${still ? '' : 'bob'}`}
    >
      <path d="M50 14c0-6 3-9 8-10" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="5" r="4" fill="var(--accent)" />
      <path
        d="M50 16C24 16 12 36 14 58c2 22 16 32 36 32s34-10 36-32C88 36 76 16 50 16Z"
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <ellipse cx="29" cy="62" rx="6" ry="4" fill="var(--accent)" opacity="0.25" />
      <ellipse cx="71" cy="62" rx="6" ry="4" fill="var(--accent)" opacity="0.25" />
      {mood === 'sleepy' ? (
        <>
          <path d="M33 51q5 5 10 0M57 51q5 5 10 0" fill="none" stroke={face} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M44 66q6 3 12 0" fill="none" stroke={face} strokeWidth="3.5" strokeLinecap="round" />
          <text x="76" y="30" fontSize="14" fill="var(--accent)" fontFamily="var(--font-display)">z</text>
          <text x="84" y="20" fontSize="10" fill="var(--accent)" fontFamily="var(--font-display)">z</text>
        </>
      ) : mood === 'party' ? (
        <>
          <path d="M38 44l2.5 5 5.5.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.5-.7ZM62 44l2.5 5 5.5.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.5-.7Z" fill="var(--accent)" />
          <path d="M40 64q10 12 20 0Z" fill={face} />
          <circle cx="12" cy="30" r="3" fill="var(--accent)" />
          <circle cx="90" cy="38" r="2.5" fill="var(--accent)" />
          <circle cx="20" cy="12" r="2" fill="var(--accent)" />
        </>
      ) : mood === 'happy' ? (
        <>
          <path d="M33 53q5-8 10 0M57 53q5-8 10 0" fill="none" stroke={face} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M40 63q10 12 20 0" fill="none" stroke={face} strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="38" cy="52" r="4" fill={face} />
          <circle cx="62" cy="52" r="4" fill={face} />
          <path d="M42 64q8 7 16 0" fill="none" stroke={face} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/** Mascot with a speech bubble. With whimsy on and some quips, tapping Pip makes it hop and say one. */
export function Says({ mood, children, quips }: { mood?: Mood; children: React.ReactNode; quips?: string[] }) {
  const whimsy = useWhimsy()
  const [n, setN] = useState(-1)
  const [hop, setHop] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const talk = whimsy && !!quips?.length

  const tap = () => {
    setN((i) => (i + 1) % quips!.length)
    setHop((h) => h + 1)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setN(-1), 6000)
  }

  const pip = <span key={hop} className={hop ? 'hop inline-block' : 'inline-block'}><Mascot mood={n >= 0 ? 'happy' : mood} /></span>

  return (
    <div className="flex items-end gap-3">
      {talk ? (
        <button type="button" onClick={tap} aria-label="Tap Pip" className="min-h-0 shrink-0 rounded-full">{pip}</button>
      ) : (
        pip
      )}
      <div className="sticker relative mb-3 flex-1 rounded-3xl rounded-bl-md bg-surface px-5 py-4" aria-live="polite">
        {talk && n >= 0 ? <p className="font-display text-lg font-semibold">{quips![n]}</p> : children}
      </div>
    </div>
  )
}
