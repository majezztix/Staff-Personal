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

  const dim = size === 'lg' ? 'w-[320px] h-[460px]' : size === 'sm' ? 'w-[200px] h-[290px]' : 'w-[260px] h-[380px]'

  const inner = (
    <div
      className={`${dim} relative overflow-hidden rounded-2xl shadow-card ring-1 ring-white/10`}
      style={{
        background: theme
          ? `linear-gradient(155deg, ${theme.primary}33 0%, rgba(2,6,23,0.95) 45%, rgba(2,6,23,1) 100%)`
          : 'linear-gradient(155deg, rgba(100,116,139,0.25), rgba(2,6,23,1))',
        boxShadow: theme ? `0 30px 70px -25px ${theme.glow}, 0 8px 28px -10px rgba(0,0,0,0.6)` : undefined,
      }}
    >
      {/* frame ornament */}
      <div className="absolute inset-0 bg-card-frame" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* header banner */}
      <div className="relative flex items-center justify-between px-4 pt-3">
        <div
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{
            backgroundColor: theme ? `${theme.primary}33` : 'rgba(100,116,139,0.3)',
            color: theme?.primary || '#94A3B8',
          }}
        >
          <Icon size={11} strokeWidth={3} />
          {theme?.label || 'UNASSESSED'}
        </div>
        <div className="font-display text-[11px] uppercase tracking-widest text-ink-400">
          {employee.department || '—'}
        </div>
      </div>

      {/* portrait */}
      <div className="relative mx-4 mt-3 aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-white/10">
        {employee.photoPath ? (
          <img src={employee.photoPath} alt={employee.fullName} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-ink-900/80 text-ink-600">
            <UserRound size={56} />
          </div>
        )}
        {theme && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{ background: `radial-gradient(circle at 50% 0%, ${theme.primary}55, transparent 65%)` }}
          />
        )}
      </div>

      {/* name */}
      <div className="px-4 pt-3">
        <div className="font-display text-base font-bold leading-tight text-ink-50">{employee.fullName}</div>
        <div className="text-[11px] text-ink-400">{employee.position}</div>
      </div>

      {/* stats */}
      <div className="space-y-2 px-4 pb-4 pt-3">
        <StatBar label="Skill" value={latest?.skillScore ?? 0} color="#3B82F6" />
        <StatBar label="Will" value={latest?.willScore ?? 0} color="#A855F7" />
      </div>

      {/* footer flavor */}
      {theme && (
        <div className="absolute inset-x-0 bottom-0 px-4 py-2 text-center text-[10px] uppercase tracking-[0.3em] text-ink-400">
          {theme.tagline}
        </div>
      )}
    </div>
  )

  if (!interactive) return inner
  return <CardTilt className={dim}>{inner}</CardTilt>
}
