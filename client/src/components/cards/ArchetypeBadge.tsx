import { Sun, Compass, Flame, Shield } from 'lucide-react'
import type { Archetype } from '../../api/client'
import { ARCHETYPES } from '../../lib/archetypes'

const ICONS = { sun: Sun, compass: Compass, flame: Flame, shield: Shield }

export default function ArchetypeBadge({ archetype, size = 'md' }: { archetype: Archetype; size?: 'sm' | 'md' | 'lg' }) {
  const t = ARCHETYPES[archetype]
  const Icon = ICONS[t.iconKey]
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }
  const iconSize = size === 'lg' ? 16 : size === 'sm' ? 10 : 12
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider ring-1 ${sizes[size]}`}
      style={{
        backgroundColor: `${t.primary}22`,
        color: t.primary,
        boxShadow: `inset 0 0 0 1px ${t.primary}55`,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.4} />
      {t.label}
    </span>
  )
}
