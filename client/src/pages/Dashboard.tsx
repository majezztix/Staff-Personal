import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sun, Compass, Flame, Shield, ArrowRight, Users, TrendingUp,
  UserCheck, Activity, FileDown, Trophy, UserRound, Building2, Send,
} from 'lucide-react'
import { api, type Archetype, type Assessment } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import PageHeader from '../components/layout/PageHeader'
import QuadrantPlot, { type QuadrantPoint } from '../components/charts/QuadrantPlot'
import ArchetypeBadge from '../components/cards/ArchetypeBadge'

const ICONS = { sun: Sun, compass: Compass, flame: Flame, shield: Shield }

type Overview = {
  total: number
  assessed: number
  unassessed: number
  counts: Record<Archetype, number>
}

type RecentAssessment = Assessment & {
  source: 'ADMIN' | 'SELF'
  employee: {
    id: string
    fullName: string
    department: string
    position: string
    photoPath: string | null
  }
}

type TopPerformer = {
  id: string
  fullName: string
  department: string
  position: string
  photoPath: string | null
  archetype: Archetype
  skillScore: number
  willScore: number
  combined: number
}

type DepartmentStat = {
  department: string
  total: number
  assessed: number
  avgSkill: number
  avgWill: number
  counts: Record<Archetype, number>
}

type TimelinePoint = { week: string; total: number; admin: number; self: number }

export default function Dashboard() {
  const { data: overview } = useQuery<Overview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data,
  })

  const { data: quadrant = [] } = useQuery<QuadrantPoint[]>({
    queryKey: ['analytics', 'quadrant'],
    queryFn: async () => (await api.get('/analytics/quadrant')).data,
  })

  const { data: recent = [] } = useQuery<RecentAssessment[]>({
    queryKey: ['analytics', 'recent'],
    queryFn: async () => (await api.get('/analytics/recent')).data,
  })

  const { data: topPerformers = [] } = useQuery<TopPerformer[]>({
    queryKey: ['analytics', 'top-performers'],
    queryFn: async () => (await api.get('/analytics/top-performers')).data,
  })

  const { data: byDept = [] } = useQuery<DepartmentStat[]>({
    queryKey: ['analytics', 'department-stats'],
    queryFn: async () => (await api.get('/analytics/department-stats')).data,
  })

  const { data: timeline = [] } = useQuery<TimelinePoint[]>({
    queryKey: ['analytics', 'timeline'],
    queryFn: async () => (await api.get('/analytics/timeline')).data,
  })

  const assessedPct = overview?.total ? Math.round((overview.assessed / overview.total) * 100) : 0
  const totalThisMonth = useMemo(() => {
    const now = new Date()
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return recent.filter((r) => r.takenAt.slice(0, 7) === ym).length
  }, [recent])

  const maxTimeline = Math.max(1, ...timeline.map((t) => t.total))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="ภาพรวมทีมในมุมมอง Skill × Will"
        actions={
          <>
            <a className="btn-secondary" href="/api/export/dashboard.pdf" target="_blank" rel="noreferrer">
              <FileDown size={15} /> Dashboard PDF
            </a>
            <Link to="/roster" className="btn-primary">
              <Users size={15} /> ไปที่ Roster
            </Link>
          </>
        }
      />

      {/* ── KPI tiles ──────────────────────────────────── */}
      <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="พนักงานทั้งหมด"
          value={overview?.total ?? 0}
          sub={`ประเมินแล้ว ${overview?.assessed ?? 0} (${assessedPct}%)`}
          accent="#94A3B8"
          progress={assessedPct}
          icon={<Users size={15} />}
        />
        <KpiTile
          label="ประเมินเดือนนี้"
          value={totalThisMonth}
          sub={`รวม 12 สัปดาห์: ${timeline.reduce((s, t) => s + t.total, 0)} ครั้ง`}
          accent="#3B82F6"
          icon={<Activity size={15} />}
        />
        <KpiTile
          label="ยังไม่ได้ประเมิน"
          value={overview?.unassessed ?? 0}
          sub="ส่งลิงก์เพื่อให้ทำประเมินตนเอง"
          accent="#F59E0B"
          icon={<Send size={15} />}
        />
        <KpiTile
          label="แผนกทั้งหมด"
          value={byDept.length}
          sub={byDept[0] ? `Top: ${byDept[0].department} (${byDept[0].total})` : '—'}
          accent="#A855F7"
          icon={<Building2 size={15} />}
        />
      </div>

      {/* ── Archetype distribution ────────────────────── */}
      <div className="panel mb-6 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Archetype Distribution</h2>
            <p className="mt-0.5 text-xs text-ink-600">การกระจาย archetype จากการประเมินล่าสุดของแต่ละคน</p>
          </div>
          <div className="text-xs text-ink-600">
            <UserCheck size={12} className="inline mr-1" />
            {overview?.assessed ?? 0} / {overview?.total ?? 0} ประเมินแล้ว
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {(Object.keys(ARCHETYPES) as Archetype[]).map((k, i) => {
            const t = ARCHETYPES[k]
            const Icon = ICONS[t.iconKey]
            const count = overview?.counts[k] ?? 0
            const pct = overview?.assessed ? Math.round((count / overview.assessed) * 100) : 0
            return (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-white/[0.06] p-4"
                style={{
                  background: `linear-gradient(155deg, ${t.primary}1A 0%, var(--tile-bg-end) 100%)`,
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: t.primary }}>{t.label}</span>
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md"
                    style={{ backgroundColor: `${t.primary}20`, color: t.primary }}
                  >
                    <Icon size={13} />
                  </span>
                </div>
                <div className="font-display text-3xl font-bold text-white">{count}</div>
                <div className="mt-1 text-[10px] text-ink-500">{pct}% ของผู้ประเมิน</div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: t.primary }} />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Battle grid + Activity timeline */}
        <div className="space-y-6">
          {/* Quadrant */}
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Battle Grid</h2>
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

          {/* Timeline */}
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Assessment Activity</h2>
                <p className="mt-0.5 text-xs text-ink-600">12 สัปดาห์ที่ผ่านมา</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-ink-500">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />Admin</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-purple-400" />Self</span>
              </div>
            </div>
            {timeline.length === 0 ? (
              <div className="grid place-items-center py-12 text-sm text-ink-600">
                ยังไม่มีการประเมินใน 12 สัปดาห์ที่ผ่านมา
              </div>
            ) : (
              <div className="flex h-32 items-end gap-1.5">
                {timeline.map((t) => {
                  const adminH = (t.admin / maxTimeline) * 100
                  const selfH = (t.self / maxTimeline) * 100
                  return (
                    <div
                      key={t.week}
                      className="group relative flex flex-1 flex-col items-stretch justify-end"
                      title={`${t.week}: ${t.total} ครั้ง`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${selfH}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="bg-purple-400/80 group-hover:bg-purple-400"
                        style={{ minHeight: t.self ? 2 : 0 }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${adminH}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                        className="rounded-b-sm bg-amber-400/80 group-hover:bg-amber-400"
                        style={{ minHeight: t.admin ? 2 : 0 }}
                      />
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-ink-700 opacity-0 transition group-hover:opacity-100">
                        {t.week.slice(5)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Department breakdown */}
          {byDept.length > 0 && (
            <div className="panel p-6">
              <div className="mb-5">
                <h2 className="font-display text-lg font-bold text-white">By Department</h2>
                <p className="mt-0.5 text-xs text-ink-600">ค่าเฉลี่ยและการกระจายแยกตามแผนก</p>
              </div>
              <div className="space-y-2">
                {byDept.map((d) => (
                  <div key={d.department} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-display text-sm font-bold text-ink-100">{d.department}</div>
                      <div className="flex items-center gap-3 text-[11px] text-ink-500">
                        <span><Users size={11} className="inline mr-1" />{d.total}</span>
                        <span className="text-blue-400">S {d.avgSkill || '—'}</span>
                        <span className="text-purple-400">W {d.avgWill || '—'}</span>
                      </div>
                    </div>
                    {/* Stacked archetype bar */}
                    <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.04]">
                      {(Object.keys(ARCHETYPES) as Archetype[]).map((k) => {
                        const c = d.counts[k] || 0
                        const w = d.assessed ? (c / d.assessed) * 100 : 0
                        if (w === 0) return null
                        return <div key={k} style={{ width: `${w}%`, background: ARCHETYPES[k].primary }} />
                      })}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-ink-600">
                      <span>ประเมินแล้ว {d.assessed} / {d.total}</span>
                      <span>{d.assessed && d.total ? Math.round((d.assessed / d.total) * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Top performers + Recent activity */}
        <div className="space-y-6">
          {/* Top performers */}
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Trophy size={15} className="text-amber-300" />
              <h2 className="font-display text-base font-bold text-white">Top Performers</h2>
            </div>
            {topPerformers.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-600">
                ยังไม่มีข้อมูลประเมิน
              </div>
            ) : (
              <div className="space-y-2">
                {topPerformers.map((p, i) => {
                  const t = ARCHETYPES[p.archetype]
                  return (
                    <Link
                      key={p.id}
                      to={`/employees/${p.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:bg-white/[0.05]"
                    >
                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: `${t.primary}22`,
                          color: t.primary,
                          boxShadow: `inset 0 0 0 1px ${t.primary}33`,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink-100">{p.fullName}</div>
                        <div className="truncate text-[10px] text-ink-600">{p.position} · {p.department}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-ink-100">{p.combined.toFixed(0)}</div>
                        <div className="text-[9px] text-ink-600">S{p.skillScore.toFixed(0)} W{p.willScore.toFixed(0)}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={15} className="text-blue-300" />
              <h2 className="font-display text-base font-bold text-white">Recent Assessments</h2>
            </div>
            {recent.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-600">ยังไม่มีกิจกรรม</div>
            ) : (
              <div className="space-y-2">
                {recent.slice(0, 6).map((r) => (
                  <Link
                    key={r.id}
                    to={`/employees/${r.employee.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] px-2.5 py-2 transition hover:bg-white/[0.04]"
                  >
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.05] text-ink-600">
                      <UserRound size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-ink-100">{r.employee.fullName}</div>
                      <div className="flex items-center gap-2 text-[10px] text-ink-600">
                        <span>{new Date(r.takenAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</span>
                        <span className={`rounded px-1.5 py-px font-bold ${r.source === 'SELF' ? 'bg-purple-500/15 text-purple-300' : 'bg-amber-500/15 text-amber-300'}`}>
                          {r.source === 'SELF' ? 'Self' : 'Admin'}
                        </span>
                      </div>
                    </div>
                    <ArchetypeBadge archetype={r.archetype} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Exports */}
          <div className="panel p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">Exports</div>
            <a className="btn-secondary mb-2 w-full justify-between text-sm" href="/api/export/dashboard.pdf" target="_blank" rel="noreferrer">
              Dashboard PDF <ArrowRight size={13} />
            </a>
            <a className="btn-secondary mb-2 w-full justify-between text-sm" href="/api/export/roster.pdf" target="_blank" rel="noreferrer">
              Roster PDF <ArrowRight size={13} />
            </a>
            <a className="btn-secondary mb-2 w-full justify-between text-sm" href="/api/export/employees.xlsx" download>
              Employees XLSX <ArrowRight size={13} />
            </a>
            <a className="btn-secondary w-full justify-between text-sm" href="/api/export/employees.csv" download>
              Employees CSV <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiTile({
  label, value, sub, accent, icon, progress,
}: {
  label: string
  value: number
  sub: string
  accent: string
  icon: React.ReactNode
  progress?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel relative overflow-hidden p-5"
    >
      <div className="absolute inset-0 opacity-[0.18]"
        style={{ background: `radial-gradient(circle at 90% 0%, ${accent} 0%, transparent 60%)` }} />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">{label}</span>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05]" style={{ color: accent }}>
            {icon}
          </span>
        </div>
        <div className="font-display text-4xl font-bold text-white">{value.toLocaleString('en-US')}</div>
        <div className="mt-1.5 text-[10px] text-ink-600 truncate">{sub}</div>
        {typeof progress === 'number' && (
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink-800/80">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: accent }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
