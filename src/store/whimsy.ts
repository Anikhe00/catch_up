import { useSyncExternalStore } from 'react'

const KEY = 'catch-up:whimsy'
const subs = new Set<() => void>()

function load(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

let on = load()

function apply() {
  document.documentElement.dataset.whimsy = on ? 'on' : 'off'
}

export function initWhimsy() {
  apply()
}

export function setWhimsy(v: boolean) {
  on = v
  apply()
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off')
  } catch {
    // ignore
  }
  subs.forEach((f) => f())
}

export function useWhimsy(): boolean {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => on,
  )
}
