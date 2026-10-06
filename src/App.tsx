import { useState } from 'react'
import { defaultTerm } from './data/defaults'
import { freshTerm } from './store/actions'
import { AppDataProvider, useAppData } from './store/AppDataContext'
import { useToday } from './store/useToday'
import { Setup } from './screens/Setup'
import { Today } from './screens/Today'
import { Routine } from './screens/Routine'
import { Grid } from './screens/Grid'
import { History } from './screens/History'
import { Settings } from './screens/Settings'
import type { UnitRef } from './logic/units'
import { Doodles } from './components/Doodles'
import { Celebration } from './components/Celebration'
import { AssessmentSheet } from './components/AssessmentSheet'
import { useCelebration } from './store/useCelebration'

type Tab = 'today' | 'grid' | 'history' | 'settings'
const ICONS: Record<Tab, string> = {
  today: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
  grid: 'M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z',
  history: 'M7 4h10M7 20h10M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8s8 3 8 8',
  settings: 'M5 8h8M17 8h2M5 16h2M11 16h8M15 6v4M9 14v4',
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'grid', label: 'Grid' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]

function Shell() {
  const { data, term, startTerm, archiveTerm } = useAppData()
  const today = useToday()
  const [tab, setTab] = useState<Tab>('today')
  const [open, setOpen] = useState<{ courseId: string; week: number } | null>(null)
  const [pick, setPick] = useState<UnitRef | null>(null)
  const { shown, dismiss } = useCelebration(term)
  const [caId, setCaId] = useState<string | null>(null)

  if (!term) {
    const archived = data.terms.filter((t) => t.archivedAt)
    const last = archived[archived.length - 1]
    return <Setup initial={last ? freshTerm(last, today) : defaultTerm()} onDone={(t) => { setTab('today'); startTerm(t) }} />
  }

  const openUnit = (r: UnitRef) => setOpen({ courseId: r.course.id, week: r.week })

  const celebration = shown && (
    <Celebration
      info={shown.info}
      onClose={dismiss}
      onToday={() => {
        dismiss()
        setOpen(null)
        setTab('today')
      }}
      onNext={() => {
        dismiss()
        if (shown.next) openUnit(shown.next)
      }}
      onAssessment={(id) => {
        dismiss()
        setCaId(id)
      }}
    />
  )
  const caSheet = caId && <AssessmentSheet term={term} courseId={caId} today={today} onClose={() => setCaId(null)} />

  if (open) {
    return (
      <>
        <Routine term={term} courseId={open.courseId} week={open.week} today={today} onBack={() => setOpen(null)} />
        {celebration}
        {caSheet}
      </>
    )
  }

  return (
    <>
      <Doodles />
      {celebration}
      {caSheet}
      {tab === 'today' && <Today term={term} today={today} pick={pick} onPick={setPick} onOpen={openUnit} onOpenCA={setCaId} />}
      {tab === 'grid' && <Grid term={term} today={today} onOpen={openUnit} onOpenCA={setCaId} />}
      {tab === 'history' && <History onNewTerm={() => archiveTerm(today)} />}
      {tab === 'settings' && <Settings term={term} today={today} />}

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
                className={`flex h-[68px] w-full flex-col items-center justify-center gap-0.5 text-xs font-bold ${tab === t.id ? 'text-accent' : 'text-soft'}`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${tab === t.id ? 'bg-accent-soft' : ''}`}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={ICONS[t.id]} />
                  </svg>
                </span>
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

export default function App() {
  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  )
}
