import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Compass, Flame, Shield, ArrowRight, Users, TrendingUp, UserCheck } from 'lucide-react'
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

  const assessedPct = overview?.total
    ? Math.round((overview.assessed / overview.total) * 100)
    : 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมทีมในมุมมอง Skill × Will"
        actions={
          <Link to="/roster" className="btn-secondary">
            <Users size={15} /> ดู Roster <ArrowRight size={13} />
          </Link>
        }
      />

      {/* ── KPI row ──────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Total */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel relative overflow-hidden p-5 sm:col-span-2 xl:col-span-1"
        >
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 90% 10%, #94A3B855, transparent 65%)' }} />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">ทั้งหมด</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05]">
                <Users size={15} className="text-ink-400" />
              </span>
            </div>
            <div className="font-display text-4xl font-bold text-white">{overview?.total ?? 0}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
              <UserCheck size={12} />
              ประเมินแล้ว {overview?.assessed ?? 0} คน ({assessedPct}%)
            </div>
            {overview?.total ? (
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-800/80">
                <div className="h-full rounded-full bg-amber-400/70" style={{ width: `${assessedPct}%` }} />
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Archetype tiles */}
        {(Object.keys(ARCHETYPES) as Archetype[]).map((k, i) => {
          const t = ARCHETYPES[k]
          const Icon = ICONS[t.iconKey]
          const count = overview?.counts[k] ?? 0
          const pct = overview?.assessed ? Math.round((count / overview.assessed) * 100) : 0
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * (i + 1) }}
              className="panel relative overflow-hidden p-5"
            >
              <div className="absolute inset-0 opacity-25"
                style={{ background: `radial-gradient(circle at 90% 10%, ${t.primary}55, transparent 65%)` }} />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: t.primary }}
                  >
                    {t.label}
                  </span>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${t.primary}18` }}
                  >
                    <Icon size={15} style={{ color: t.primary }} />
                  </span>
                </div>
                <div className="font-display text-4xl font-bold text-white">{count}</div>
                <div className="mt-1.5 text-[10px] text-ink-600">{t.tagline}</div>
                {overview?.assessed ? (
                  <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: t.primary }}
                    />
                  </div>
                ) : null}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Bottom grid ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* Battle grid */}
        <div className="panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Battle Grid</h2>
              <p className="mt-0.5 text-xs text-ink-600">Skill × Will quadrant map</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-ink-500">
              <TrendingUp size={12} />
              {quadrant.length} จุด
            </div>
          </div>
          {quadrant.length === 0 ? (
            <div className="grid place-items-center py-20 text-sm text-ink-600">
              ยังไม่มีผลประเมิน
            </div>
          ) : (
            <QuadrantPlot points={quadrant} />
          )}
        </div>

        {/* Quick actions */}
        <div className="panel flex flex-col gap-2 p-5">
          <h2 className="mb-2 font-display text-base font-bold text-white">Quick Actions</h2>

          <Link to="/roster" className="btn-secondary justify-between text-sm">
            ดูพนักงานทั้งหมด <ArrowRight size={13} />
          </Link>
          <Link to="/analytics" className="btn-secondary justify-between text-sm">
            วิเคราะห์รายแผนก <ArrowRight size={13} />
          </Link>

          <div className="my-1 h-px bg-white/[0.05]" />

          <a className="btn-secondary justify-between text-sm" href="/api/export/employees.xlsx" download>
            Export XLSX <ArrowRight size={13} />
          </a>
          <a className="btn-secondary justify-between text-sm" href="/api/export/employees.csv" download>
            Export CSV <ArrowRight size={13} />
          </a>

          {/* Legend */}
          <div className="mt-auto pt-4">
            <div className="divider mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ARCHETYPES) as Archetype[]).map((k) => {
                const t = ARCHETYPES[k]
                return (
                  <div key={k} className="flex items-center gap-2 text-[10px] text-ink-500">
                    <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: t.primary }} />
                    {t.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
