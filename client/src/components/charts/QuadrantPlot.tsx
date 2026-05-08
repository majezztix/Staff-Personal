import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Archetype } from '../../api/client'
import { ARCHETYPES } from '../../lib/archetypes'

export type QuadrantPoint = {
  id: string
  fullName: string
  position: string
  department: string
  photoPath: string | null
  x: number
  y: number
  archetype: Archetype
}

const QUADRANTS = [
  { x0: 50, y0: 50, label: 'DELEGATE', archetype: 'DELEGATE' as Archetype, gridCol: 2, gridRow: 1 },
  { x0: 0, y0: 50, label: 'COACH', archetype: 'COACH' as Archetype, gridCol: 1, gridRow: 1 },
  { x0: 50, y0: 0, label: 'INSPIRE', archetype: 'INSPIRE_SUPPORT' as Archetype, gridCol: 2, gridRow: 2 },
  { x0: 0, y0: 0, label: 'TELL', archetype: 'TELL' as Archetype, gridCol: 1, gridRow: 2 },
]

export default function QuadrantPlot({ points }: { points: QuadrantPoint[] }) {
  return (
    <div className="relative aspect-square w-full max-w-[680px] mx-auto rounded-2xl border border-white/10 bg-ink-950/60 p-2 shadow-card">
      {/* quadrant tints */}
      <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-xl">
        {QUADRANTS.map((q) => {
          const t = ARCHETYPES[q.archetype]
          return (
            <div
              key={q.label}
              className="relative"
              style={{
                gridColumn: q.gridCol,
                gridRow: q.gridRow,
                background: `linear-gradient(${q.archetype === 'DELEGATE' ? '225deg' : q.archetype === 'COACH' ? '315deg' : q.archetype === 'TELL' ? '45deg' : '135deg'}, ${t.primary}26, transparent 70%)`,
              }}
            >
              <div
                className="absolute font-display text-xs font-bold uppercase tracking-[0.3em]"
                style={{
                  color: t.primary,
                  opacity: 0.6,
                  top: q.gridRow === 1 ? 8 : 'auto',
                  bottom: q.gridRow === 2 ? 8 : 'auto',
                  left: q.gridCol === 1 ? 12 : 'auto',
                  right: q.gridCol === 2 ? 12 : 'auto',
                }}
              >
                {t.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* axis lines */}
      <div className="pointer-events-none absolute inset-2">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/10" />
      </div>

      {/* axis labels */}
      <div className="pointer-events-none absolute inset-2 text-[10px] uppercase tracking-widest text-ink-500">
        <div className="absolute -bottom-6 left-0">low skill</div>
        <div className="absolute -bottom-6 right-0">high skill →</div>
        <div className="absolute -left-1 top-0 -translate-x-full">↑ high will</div>
        <div className="absolute -left-1 bottom-0 -translate-x-full">low will</div>
      </div>

      {/* points */}
      <div className="absolute inset-2">
        {points.map((p, i) => {
          const t = ARCHETYPES[p.archetype]
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
              className="group absolute -translate-x-1/2 translate-y-1/2"
              style={{
                left: `${p.x}%`,
                bottom: `${p.y}%`,
              }}
            >
              <Link to={`/employees/${p.id}`}>
                <div
                  className="relative h-10 w-10 overflow-hidden rounded-full ring-2 transition-transform group-hover:scale-125 group-hover:z-10"
                  style={{
                    borderColor: t.primary,
                    boxShadow: `0 0 0 2px ${t.primary}, 0 0 20px ${t.primary}66`,
                  }}
                >
                  {p.photoPath ? (
                    <img src={p.photoPath} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className="grid h-full w-full place-items-center text-sm font-bold"
                      style={{ backgroundColor: t.primary + '55', color: t.primary }}
                    >
                      {p.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 text-[11px] text-ink-100 opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                  {p.fullName}
                  <div className="text-[10px] text-ink-400">{p.position}</div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
