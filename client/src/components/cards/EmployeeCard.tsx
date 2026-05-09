import { Sun, Compass, Flame, Shield, UserRound } from 'lucide-react'
import type { Employee } from '../../api/client'
import { ARCHETYPES } from '../../lib/archetypes'
import StatBar from './StatBar'
import CardTilt from './CardTilt'

const ICONS = { sun: Sun, compass: Compass, flame: Flame, shield: Shield }

export default function EmployeeCard({
  employee,
  size = 'md',
  interactive = true,
}: {
  employee: Employee
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}) {
  const latest = employee.latest
  const theme = latest ? ARCHETYPES[latest.archetype] : null
  const Icon = theme ? ICONS[theme.iconKey] : UserRound

  const dim =
    size === 'lg' ? 'w-[300px] h-[440px]' :
    size === 'sm' ? 'w-[200px] h-[290px]' :
    'w-[260px] h-[380px]'

  const inner = (
    <div
      className={`${dim} relative overflow-hidden rounded-[20px]`}
      style={{
        background: theme
          ? `linear-gradient(160deg, ${theme.primary}28 0%, rgba(7,9,15,0.97) 42%, rgba(7,9,15,1) 100%)`
          : 'linear-gradient(160deg, rgba(100,116,139,0.18), rgba(7,9,15,1))',
        boxShadow: theme
          ? `0 0 0 1px ${theme.primary}28, 0 28px 64px -20px ${theme.glow}, 0 8px 24px -8px rgba(0,0,0,0.7)`
          : '0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -16px rgba(0,0,0,0.6)',
      }}
    >
      {/* card frame light */}
      <div className="absolute inset-0 bg-card-frame opacity-80" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* archetype colour strip at top */}
      {theme && (
        <div
          className="absolute inset-x-0 top-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}
        />
      )}

      {/* header */}
      <div className="relative flex items-center justify-between px-4 pt-4">
        <div
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
          style={{
            backgroundColor: theme ? `${theme.primary}22` : 'rgba(100,116,139,0.2)',
            color: theme?.primary || '#64748B',
            boxShadow: theme ? `inset 0 0 0 1px ${theme.primary}33` : 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <Icon size={10} strokeWidth={2.5} />
          {theme?.label || 'UNASSESSED'}
        </div>
        <div className="font-display text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-600">
          {employee.department || '—'}
        </div>
      </div>

      {/* portrait */}
      <div className="relative mx-4 mt-3 aspect-[4/3] overflow-hidden rounded-[12px]"
        style={{
          boxShadow: theme
            ? `0 0 0 1px ${theme.primary}33, inset 0 0 0 1px rgba(0,0,0,0.3)`
            : '0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {employee.photoPath ? (
          <img src={employee.photoPath} alt={employee.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-ink-900/90">
            <UserRound size={52} className="text-ink-700" />
          </div>
        )}
        {theme && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{ background: `radial-gradient(circle at 50% 0%, ${theme.primary}44, transparent 65%)` }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink-950/70 to-transparent" />
      </div>

      {/* name block */}
      <div className="px-4 pt-3">
        <div className="font-display text-[15px] font-bold leading-tight text-white">{employee.fullName}</div>
        <div className="mt-0.5 text-[10px] font-medium text-ink-500">{employee.position}</div>
      </div>

      {/* stat bars */}
      <div className="space-y-2.5 px-4 pb-5 pt-3">
        <StatBar label="Skill" value={latest?.skillScore ?? 0} color="#60A5FA" />
        <StatBar label="Will"  value={latest?.willScore  ?? 0} color="#C084FC" />
      </div>

      {/* bottom tagline */}
      {theme && (
        <div
          className="absolute inset-x-0 bottom-0 px-4 py-2 text-center text-[9px] uppercase tracking-[0.28em] font-semibold"
          style={{ color: `${theme.primary}80` }}
        >
          {theme.tagline}
        </div>
      )}
    </div>
  )

  if (!interactive) return inner
  return <CardTilt className={dim}>{inner}</CardTilt>
}
