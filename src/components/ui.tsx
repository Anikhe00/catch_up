import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent shadow-[0_4px_0_var(--accent-deep)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--accent-deep)]',
  secondary:
    'border-2 border-line bg-surface text-ink shadow-[0_4px_0_var(--line)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--line)]',
  ghost: 'text-accent underline decoration-wavy decoration-1 underline-offset-4',
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  function Button({ variant = 'secondary', className = '', ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`min-h-12 rounded-2xl px-5 text-base font-bold transition-transform ${variants[variant]} ${className}`}
        {...props}
      />
    )
  },
)

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-soft hover:bg-accent-soft disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-soft">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-ink">{error}</span>}
    </label>
  )
}

export const inputClass = 'w-full rounded-2xl border-2 border-line bg-surface px-4 text-base text-ink'

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      {hint && <p className="mt-1 text-sm text-soft">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`sticker rounded-3xl bg-surface p-5 ${className}`}>{children}</div>
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-xl text-left"
    >
      <span>{label}</span>
      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-line px-0.5 transition-colors ${checked ? 'bg-accent' : 'bg-accent-soft'}`}>
        <span className={`h-6 w-6 rounded-full bg-surface shadow transition-transform ${checked ? 'translate-x-6' : ''}`} />
      </span>
    </button>
  )
}

export function ProgressBar({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} className="h-3.5 overflow-hidden rounded-full border-2 border-line bg-surface p-[2px]">
      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="sticker flex min-h-14 w-full items-center gap-4 rounded-2xl bg-surface px-4 text-left"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${checked ? 'pop border-accent bg-accent text-on-accent' : 'border-line'}`} aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      <span className={checked ? 'text-soft line-through' : ''}>{children}</span>
    </button>
  )
}

interface Item {
  id: string
  label: string
}

/** Editable ordered list: rename, reorder, delete, add. */
export function ListEditor<T extends Item>({
  items,
  onChange,
  makeItem,
  addLabel,
  itemLabel = 'Step',
}: {
  items: T[]
  onChange: (items: T[]) => void
  makeItem: (label: string) => T
  addLabel: string
  /** Spoken name for each row, e.g. "Step" gives "Step 2". */
  itemLabel?: string
}) {
  const set = (i: number, label: string) => onChange(items.map((x, j) => (j === i ? { ...x, label } : x)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <>
      {items.map((it, i) => (
        <div key={it.id} className="flex items-center gap-1">
          <input className={inputClass} aria-label={`${itemLabel} ${i + 1}`} value={it.label} onChange={(e) => set(i, e.target.value)} />
          <IconButton label={`Move ${itemLabel.toLowerCase()} ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</IconButton>
          <IconButton label={`Move ${itemLabel.toLowerCase()} ${i + 1} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</IconButton>
          <IconButton label={`Delete ${itemLabel.toLowerCase()} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</IconButton>
        </div>
      ))}
      <Button className="w-full border-dashed" onClick={() => onChange([...items, makeItem('')])}>
        {addLabel}
      </Button>
    </>
  )
}
