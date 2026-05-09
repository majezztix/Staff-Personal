import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BarChart3, ListChecks, UserCog, LogOut,
  ChevronRight, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../store/auth'
import ThemeToggle from '../ThemeToggle'
import clsx from 'clsx'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  superadmin?: boolean
}

type NavGroup = { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: 'Insights',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/roster', label: 'Roster', icon: Users },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/questions', label: 'Question Bank', icon: ListChecks, superadmin: true },
      { to: '/admins', label: 'Admins', icon: UserCog, superadmin: true },
    ],
  },
]

export default function AppShell() {
  const { username, role, logout } = useAuth()
  const navigate = useNavigate()
  const isSuper = role === 'SUPERADMIN'

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="relative flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(245,158,11,0.06), transparent), radial-gradient(ellipse 60% 30% at 50% 100%, rgba(168,85,247,0.05), transparent)',
          }}
          aria-hidden
        />

        {/* Brand */}
        <div className="relative px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 via-fuchsia-500 to-blue-500 shadow-[0_0_20px_-4px_rgba(245,158,11,0.5)]">
              <span className="font-display text-base font-bold text-white drop-shadow-sm">T</span>
            </div>
            <div>
              <div className="font-display text-[17px] font-bold leading-none tracking-wide text-white">
                TAS Cards
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">
                Archetype Console
              </div>
            </div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group, gi) => {
            const items = group.items.filter((n) => !n.superadmin || isSuper)
            if (items.length === 0) return null
            return (
              <div key={group.label} className={clsx(gi > 0 && 'mt-5')}>
                <div className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-ink-700">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {items.map((n) => <NavRow key={n.to} item={n} />)}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Theme toggle row */}
        <div className="relative px-3 pb-2">
          <ThemeToggle />
        </div>

        {/* User pill */}
        <div className="relative border-t border-[color:var(--panel-border)] p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--overlay-soft)] p-2.5">
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-amber-100"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(168,85,247,0.15))',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              {username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink-100">{username}</div>
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-ink-500">
                {isSuper && <Sparkles size={9} className="text-amber-400" />}
                {isSuper ? 'Super Admin' : 'Admin'}
              </div>
            </div>
            <button
              onClick={async () => {
                await logout()
                navigate('/login', { replace: true })
              }}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-500 transition hover:bg-red-500/10 hover:text-red-300"
              title="ออกจากระบบ"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function NavRow({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/15'
            : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={clsx(
              'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-all',
              isActive
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/[0.04] text-ink-500 group-hover:bg-white/[0.08] group-hover:text-ink-200'
            )}
          >
            <Icon size={14} />
          </span>
          <span className="truncate">{item.label}</span>
          <ChevronRight
            size={12}
            className={clsx(
              'ml-auto shrink-0 transition-all',
              isActive ? 'text-amber-300/60' : 'text-ink-700 opacity-0 group-hover:opacity-100'
            )}
          />
        </>
      )}
    </NavLink>
  )
}
