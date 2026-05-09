import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, ListChecks, UserCog, LogOut, Zap } from 'lucide-react'
import { useAuth } from '../../store/auth'
import clsx from 'clsx'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/roster', label: 'Roster', icon: Users },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/questions', label: 'Questions', icon: ListChecks, superadmin: true },
  { to: '/admins', label: 'Admins', icon: UserCog, superadmin: true },
]

export default function AppShell() {
  const { username, role, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ───────────────────────────────────── */}
      <aside className="relative flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        {/* ambient glow behind sidebar */}
        <div className="pointer-events-none absolute inset-0 bg-sidebar-glow" aria-hidden />

        {/* Logo */}
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
          {/* separator line */}
          <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-3">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-600">
            เมนู
          </div>
          {NAV.filter((n) => !n.superadmin || role === 'SUPERADMIN').map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  clsx(
                    'group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20'
                      : 'text-ink-400 hover:bg-white/[0.05] hover:text-ink-100'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={clsx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/[0.04] text-ink-500 group-hover:bg-white/[0.07] group-hover:text-ink-200'
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    {n.label}
                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User section */}
        <div className="relative border-t border-white/[0.06] bg-ink-950/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-500/30 to-purple-500/20 ring-1 ring-white/10">
              <Zap size={14} className="text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink-100">{username}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                {role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="btn-ghost btn-sm w-full justify-start text-ink-500 hover:text-red-400"
          >
            <LogOut size={14} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
