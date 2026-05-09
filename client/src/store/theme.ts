import { useEffect, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'tas.theme'

function getSystem(): ResolvedTheme {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

function readSaved(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {/* */}
  return 'system'
}

function resolve(t: Theme): ResolvedTheme {
  return t === 'system' ? getSystem() : t
}

function apply(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  root.classList.add(resolved)
}

// ── Tiny external store so all consumers stay in sync ─────────────
let current: Theme = typeof window !== 'undefined' ? readSaved() : 'system'
const listeners = new Set<() => void>()

function emit() { listeners.forEach((l) => l()) }

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

function getSnapshot(): Theme { return current }

export function setTheme(next: Theme) {
  current = next
  try { localStorage.setItem(STORAGE_KEY, next) } catch {/* */}
  apply(resolve(next))
  emit()
}

// Apply on first import (covers cases the inline <head> script missed).
if (typeof window !== 'undefined') {
  apply(resolve(current))

  // React to OS theme changes when the user is on "system"
  const mq = window.matchMedia('(prefers-color-scheme: light)')
  const onChange = () => {
    if (current === 'system') {
      apply(resolve('system'))
      emit()
    }
  }
  mq.addEventListener?.('change', onChange)
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const resolved = resolve(theme)
  // Re-apply on mount in case SSR/HMR put us out of sync
  useEffect(() => { apply(resolved) }, [resolved])
  return { theme, resolved, setTheme }
}
