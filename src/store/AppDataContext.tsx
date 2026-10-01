import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Term } from '../types'
import { loadData, saveData } from './storage'

interface Ctx {
  data: AppData
  /** The active (non-archived) term, or null before first-run setup. */
  term: Term | null
  startTerm: (term: Term) => void
  updateTerm: (fn: (t: Term) => Term) => void
  /** Moves the current term into History and leaves no active term. */
  archiveTerm: (today: string) => void
  replaceAll: (data: AppData) => void
}

const AppDataContext = createContext<Ctx | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData)

  useEffect(() => {
    saveData(data)
  }, [data])

  const term = useMemo(() => data.terms.find((t) => t.id === data.currentTermId) ?? null, [data])

  const startTerm = useCallback((t: Term) => {
    setData((d) => ({ ...d, currentTermId: t.id, terms: [...d.terms.filter((x) => x.id !== t.id), t] }))
  }, [])

  const updateTerm = useCallback((fn: (t: Term) => Term) => {
    setData((d) => ({ ...d, terms: d.terms.map((t) => (t.id === d.currentTermId ? fn(t) : t)) }))
  }, [])

  const archiveTerm = useCallback((today: string) => {
    setData((d) => ({
      ...d,
      currentTermId: null,
      terms: d.terms.map((t) => (t.id === d.currentTermId ? { ...t, archivedAt: today } : t)),
    }))
  }, [])

  const replaceAll = useCallback((next: AppData) => setData(next), [])

  const value = useMemo(
    () => ({ data, term, startTerm, updateTerm, archiveTerm, replaceAll }),
    [data, term, startTerm, updateTerm, archiveTerm, replaceAll],
  )
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData(): Ctx {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
