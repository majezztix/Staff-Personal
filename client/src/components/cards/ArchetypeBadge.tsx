import { Sun, Compass, Flame, Shield } from 'lucide-react'
import type { Archetype } from '../../api/client'
import { ARCHETYPES } from '../../lib/archetypes'

const ICONS = { sun: Sun, compass: Compass, flame: Flame, shield: Shield }

export default function ArchetypeBadge({
  archetype,
  size = 'md',
}: {
  archetype: Archetype
  size?: 'sm' | 'md' | 'lg'
}) {
  const t = ARCHETYPES[archetype]
  const Icon = ICONS[t.iconKey]
  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-1 rounded-lg',
    md: 'px-2.5 py-1 text-[10px] gap-1.5 rounded-lg',
    lg: 'px-3.5 py-1.5 text-xs gap-2 rounded-xl',
  }
  const iconSize = size === 'lg' ? 14 : size === 'sm' ? 9 : 11
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-[0.1em] ${sizes[size]}`}
      style={{
        backgroundColor: `${t.primary}18`,
        color: t.primary,
        boxShadow: `inset 0 0 0 1px ${t.primary}44`,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {t.label}
    </span>
  )
}
