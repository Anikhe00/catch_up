import { useRef, useState } from 'react'
import { Button, Card, ListEditor, Section, Switch } from '../components/ui'
import { downloadBackup, parseImport } from '../store/backup'
import { useAppData } from '../store/AppDataContext'
import { applyTheme, loadTheme, type Theme } from '../store/theme'
import { setWhimsy, useWhimsy } from '../store/whimsy'
import type { Term } from '../types'
import { TermForm, validateTerm } from './TermForm'

function Backup({ today }: { today: string }) {
  const { data, replaceAll } = useAppData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [pending, setPending] = useState<ReturnType<typeof parseImport> & { ok: true } | null>(null)

  const onFile = async (f: File | undefined) => {
    if (!f) return
    const r = parseImport(await f.text())
    if (r.ok) {
      setPending(r)
      setMsg('')
    } else {
      setPending(null)
      setMsg(r.error)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Section title="Backup" hint="One file holds every term, including archived ones.">
      <Button className="w-full" onClick={() => downloadBackup(data, today)}>Export backup</Button>
      <Button className="w-full" onClick={() => fileRef.current?.click()}>Import backup</Button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      {pending && (
        <div role="alert" className="rounded-2xl bg-accent-soft p-4">
          <p>
            This backup has {pending.data.terms.length} term{pending.data.terms.length === 1 ? '' : 's'}. Importing
            replaces everything currently on this device.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                replaceAll(pending.data)
                setPending(null)
                setMsg('Backup imported.')
              }}
            >
              Replace my data
            </Button>
            <Button className="flex-1" onClick={() => setPending(null)}>Cancel</Button>
          </div>
        </div>
      )}
      {msg && <p role="status" className="text-sm">{msg}</p>}
    </Section>
  )
}

export function Settings({ term, today }: { term: Term; today: string }) {
  const { updateTerm } = useAppData()
  const [t, setT] = useState<Term>(term)
  const [errors, setErrors] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const whimsy = useWhimsy()
  const dirty = JSON.stringify(t) !== JSON.stringify(term)

  const edit = (fn: (t: Term) => Term) => {
    setSaved(false)
    setT(fn)
  }

  const save = () => {
    const errs = validateTerm(t)
    setErrors(errs)
    if (errs.length) return
    const cleaned: Term = {
      ...t,
      name: t.name.trim(),
      unitLabel: t.unitLabel.trim() || 'Unit',
      routine: t.routine.filter((s) => s.label.trim()),
      writing: t.writing.filter((w) => w.label.trim()),
    }
    updateTerm(() => cleaned)
    setT(cleaned)
    setSaved(true)
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-32 pt-10">
      <h1 className="squiggle text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-soft">Changes apply when you save. Your pace is recalculated straight away.</p>

      <TermForm t={t} setT={edit} showDone={false} />

      <Section title="Study routine" hint="These steps appear on every unit.">
        <ListEditor
          items={t.routine}
          onChange={(routine) => edit((x) => ({ ...x, routine }))}
          makeItem={(label) => ({ id: crypto.randomUUID(), label })}
          addLabel="Add step"
        />
      </Section>

      <Section title="Writing checklist" hint="Shown once the study target date has passed.">
        <ListEditor
          items={t.writing}
          onChange={(writing) => edit((x) => ({ ...x, writing }))}
          makeItem={(label) => ({ id: crypto.randomUUID(), label, done: false })}
          addLabel="Add writing task"
          itemLabel="Writing task"
        />
      </Section>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {(['system', 'light', 'dark'] as Theme[]).map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={theme === o}
              onClick={() => {
                setTheme(o)
                applyTheme(o)
              }}
              className={`h-12 rounded-xl border capitalize ${theme === o ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'}`}
            >
              {o}
            </button>
          ))}
        </div>
        <Card className="py-2">
          <Switch checked={whimsy} onChange={setWhimsy} label="Extra whimsy: doodles, sparkles, and a Pip who talks" />
        </Card>
      </Section>

      <Backup today={today} />

      <div className="fixed inset-x-0 bottom-[68px] border-t-2 border-line bg-bg/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {errors.length > 0 && (
            <div role="alert" className="mb-2 text-sm">{errors.map((e) => <p key={e}>{e}</p>)}</div>
          )}
          <Button variant="primary" className="w-full" onClick={save}>
            {saved && !dirty ? 'Saved' : 'Save changes'}
          </Button>
        </div>
      </div>
    </main>
  )
}
