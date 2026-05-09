import { Sun, Moon, Monitor } from 'lucide-react'
import clsx from 'clsx'
import { useTheme, type Theme } from '../store/theme'

const OPTIONS: Array<{ key: Theme; icon: typeof Sun; label: string }> = [
  { key: 'light', icon: Sun, label: 'Light' },
  { key: 'system', icon: Monitor, label: 'System' },
  { key: 'dark', icon: Moon, label: 'Dark' },
]

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-lg border p-0.5',
        'border-[color:var(--panel-border)] bg-[color:var(--overlay-soft)]'
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map((o) => {
        const active = theme === o.key
        const Icon = o.icon
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => setTheme(o.key)}
            className={clsx(
              'group inline-flex items-center justify-center rounded-md transition-all',
              compact ? 'h-6 w-6' : 'h-7 px-2',
              active
                ? 'bg-amber-500/20 text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]'
                : 'text-ink-500 hover:bg-[color:var(--overlay-medium)] hover:text-ink-200'
            )}
          >
            <Icon size={compact ? 12 : 13} />
            {!compact && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider">{o.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
