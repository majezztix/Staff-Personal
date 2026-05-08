import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Compass, Flame, Shield, ArrowRight, Users } from 'lucide-react'
import { api, type Archetype } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import PageHeader from '../components/layout/PageHeader'
import QuadrantPlot, { type QuadrantPoint } from '../components/charts/QuadrantPlot'

const ICONS = { sun: Sun, compass: Compass, flame: Flame, shield: Shield }

type Overview = {
  total: number
  assessed: number
  unassessed: number
  counts: Record<Archetype, number>
}

export default function Dashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get<Overview>('/analytics/overview')).data,
  })

  const { data: quadrant = [] } = useQuery({
    queryKey: ['analytics', 'quadrant'],
    queryFn: async () => (await api.get<QuadrantPoint[]>('/analytics/quadrant')).data,
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมทีมในมุมมอง 2×2 Skill × Will"
        actions={
          <Link to="/roster" className="btn-secondary">
            <Users size={16} /> ดู Roster <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="พนักงานทั้งหมด" value={overview?.total ?? 0} accent="#94A3B8" subtitle={`ประเมินแล้ว ${overview?.assessed ?? 0}`} />
        {(Object.keys(ARCHETYPES) as Archetype[]).map((k, i) => {
          const t = ARCHETYPES[k]
          const Icon = ICONS[t.iconKey]
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (i + 1) }}
              className="panel relative overflow-hidden p-5"
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: `radial-gradient(circle at 100% 0%, ${t.primary}55, transparent 60%)` }}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest" style={{ color: t.primary }}>
                    {t.label}
                  </div>
                  <div className="mt-2 font-display text-3xl font-bold text-ink-50">
                    {overview?.counts[k] ?? 0}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">{t.tagline}</div>
                </div>
                <Icon size={22} style={{ color: t.primary }} />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-50">Battle Grid</h2>
            <div className="text-xs text-ink-500">{quadrant.length} จุดข้อมูล</div>
          </div>
          {quadrant.length === 0 ? (
            <div className="grid place-items-center py-20 text-ink-500">
              ยังไม่มีผลประเมิน
            </div>
          ) : (
            <QuadrantPlot points={quadrant} />
          )}
        </div>

        <div className="panel p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-ink-50">Quick Actions</h2>
          <Link to="/roster" className="btn-secondary w-full justify-between">
            ดูพนักงานทั้งหมด <ArrowRight size={14} />
          </Link>
          <Link to="/analytics" className="btn-secondary w-full justify-between">
            วิเคราะห์รายแผนก <ArrowRight size={14} />
          </Link>
          <a className="btn-secondary w-full justify-between" href="/api/export/employees.xlsx" download>
            Export XLSX <ArrowRight size={14} />
          </a>
          <a className="btn-secondary w-full justify-between" href="/api/export/employees.csv" download>
            Export CSV <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, accent, subtitle }: { label: string; value: number; accent: string; subtitle?: string }) {
  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 100% 0%, ${accent}55, transparent 60%)` }} />
      <div className="relative">
        <div className="text-xs font-bold uppercase tracking-widest text-ink-400">{label}</div>
        <div className="mt-2 font-display text-3xl font-bold text-ink-50">{value}</div>
        {subtitle && <div className="mt-1 text-xs text-ink-500">{subtitle}</div>}
      </div>
    </div>
  )
}
