import { useState } from 'react'
import { Button, ProgressBar } from '../components/ui'
import { Says } from '../components/Mascot'
import type { Term } from '../types'
import { TermForm, validatePart, type FormPart } from './TermForm'

const STEPS: { part: FormPart; title: string; intro: string }[] = [
  { part: 'term', title: 'Name your term', intro: 'Give it a name you will recognise, and say what one piece of study is called.' },
  { part: 'dates', title: 'Set your dates', intro: 'When you start, when you want all the study finished, and the final deadline.' },
  { part: 'courses', title: 'Add your courses', intro: 'Add each course. Tap one to set its title, its weeks, and what you will study each week.' },
  { part: 'done', title: 'Anything already done?', intro: 'Tap what you have finished. You can skip this if you are starting fresh.' },
]

export function Setup({ initial, onDone }: { initial: Term; onDone: (t: Term) => void }) {
  const [t, setT] = useState<Term>(initial)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const cur = STEPS[step]
  const last = step === STEPS.length - 1

  const go = (n: number) => {
    setErrors([])
    setStep(n)
    window.scrollTo({ top: 0 })
  }

  const next = () => {
    const errs = validatePart(t, cur.part)
    setErrors(errs)
    if (errs.length) return
    if (last) onDone({ ...t, name: t.name.trim(), unitLabel: t.unitLabel.trim() || 'Unit' })
    else go(step + 1)
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-40 pt-10">
      <p className="text-sm font-bold text-soft">Step {step + 1} of {STEPS.length}</p>
      <div className="mt-2"><ProgressBar done={step + 1} total={STEPS.length} label="Setup progress" /></div>
      <div className="mt-6">
        <Says mood={step === 3 ? 'happy' : 'calm'}>
          <h1 className="font-display text-xl font-semibold">{cur.title}</h1>
          <p className="text-soft">{cur.intro}</p>
        </Says>
      </div>

      <div className="-mt-4">
        <TermForm t={t} setT={setT} showDone only={cur.part} />
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          {errors.length > 0 && (
            <div role="alert" className="mb-3 text-sm">{errors.map((e) => <p key={e}>{e}</p>)}</div>
          )}
          <div className="flex gap-3">
            {step > 0 && <Button className="flex-1" onClick={() => go(step - 1)}>Back</Button>}
            <Button variant="primary" className="flex-[2]" onClick={next}>
              {last ? 'Start this term' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
