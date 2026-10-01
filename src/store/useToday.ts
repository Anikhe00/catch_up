import { useEffect, useState } from 'react'
import { todayStr } from '../logic/dates'

/** Today's date, refreshed when the app comes back to the foreground or the day rolls over. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayStr())
  useEffect(() => {
    const refresh = () => setToday(todayStr())
    const id = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}
