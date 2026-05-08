import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, ListChecks, UserCog, LogOut } from 'lucide-react'
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
      <aside className="w-64 shrink-0 border-r border-white/10 bg-ink-950/70 backdrop-blur-md">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-amber-500 via-purple-500 to-blue-500 font-display text-lg font-bold text-ink-950">
              T
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-wide text-amber-300">TAS Cards</div>
              <div className="text-xs text-ink-400">Archetype Console</div>
            </div>
          </div>
        </div>
        <nav className="px-3">
          {NAV.filter((n) => !n.superadmin || role === 'SUPERADMIN').map((n) => {
            const Icon = n.icon
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  clsx(
                    'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                    isActive
                      ? 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/30'
                      : 'text-ink-300 hover:bg-white/5 hover:text-ink-50'
                  )
                }
              >
                <Icon size={18} />
                {n.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-64 border-t border-white/10 bg-ink-950/80 p-4">
          <div className="mb-2 text-xs uppercase tracking-wider text-ink-500">Signed in</div>
          <div className="mb-3 text-sm text-ink-100">
            {username}
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-300">
              {role === 'SUPERADMIN' ? 'super' : 'admin'}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="btn-ghost w-full justify-start text-sm"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
