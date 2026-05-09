import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileDown, Building2, Users } from 'lucide-react'
import { api, type Archetype } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import PageHeader from '../components/layout/PageHeader'

type DepartmentStat = {
  department: string
  total: number
  assessed: number
  avgSkill: number
  avgWill: number
  counts: Record<Archetype, number>
}

const ARCHETYPE_KEYS: Archetype[] = ['DELEGATE', 'COACH', 'INSPIRE_SUPPORT', 'TELL']

export default function Analytics() {
  const { data: stats = [] } = useQuery<DepartmentStat[]>({
    queryKey: ['analytics', 'department-stats'],
    queryFn: async () => (await api.get('/analytics/department-stats')).data,
  })

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="วิเคราะห์การกระจายและค่าเฉลี่ยแต่ละแผนก"
        actions={
          <a className="btn-secondary" href="/api/export/dashboard.pdf" target="_blank" rel="noreferrer">
            <FileDown size={15} /> Export PDF
          </a>
        }
      />

      {/* Summary tiles */}
      <div className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="แผนกทั้งหมด" value={stats.length} icon={<Building2 size={15} />} />
        <SummaryTile label="พนักงาน" value={stats.reduce((s, d) => s + d.total, 0)} icon={<Users size={15} />} />
        <SummaryTile
          label="ประเมินแล้ว"
          value={stats.reduce((s, d) => s + d.assessed, 0)}
          accent="#3B82F6"
        />
        <SummaryTile
          label="ค่าเฉลี่ย Skill"
          value={Math.round(
            stats.reduce((s, d) => s + d.avgSkill * d.assessed, 0) /
              Math.max(1, stats.reduce((s, d) => s + d.assessed, 0))
          )}
          accent="#A855F7"
        />
      </div>

      {/* Legend */}
      <div className="panel mb-5 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          {ARCHETYPE_KEYS.map((k) => (
            <span key={k} className="inline-flex items-center gap-2 text-xs font-semibold text-ink-300">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ARCHETYPES[k].primary }} />
              {ARCHETYPES[k].label}
            </span>
          ))}
        </div>
      </div>

      {/* Department breakdown */}
      <div className="panel p-6">
        {stats.length === 0 ? (
          <div className="grid place-items-center py-14 text-sm text-ink-600">
            ยังไม่มีข้อมูลแผนก
          </div>
        ) : (
          <div className="space-y-5">
            {stats.map((d, di) => {
              const completion = d.total ? Math.round((d.assessed / d.total) * 100) : 0
              return (
                <motion.div
                  key={d.department}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-display text-base font-bold text-white">{d.department}</div>
                      <div className="text-[11px] text-ink-600">
                        {d.total} คน · ประเมินแล้ว {d.assessed} ({completion}%)
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-ink-500">
                        S <span className="font-display text-base font-bold text-blue-400">{d.avgSkill || '—'}</span>
                      </span>
                      <span className="text-ink-500">
                        W <span className="font-display text-base font-bold text-purple-400">{d.avgWill || '—'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stacked archetype bar */}
                  <div className="flex h-7 overflow-hidden rounded-lg bg-ink-900/60 ring-1 ring-white/[0.05]">
                    {ARCHETYPE_KEYS.map((k) => {
                      const v = d.counts[k] || 0
                      const pct = d.assessed ? (v / d.assessed) * 100 : 0
                      if (pct === 0) return null
                      const t = ARCHETYPES[k]
                      return (
                        <div
                          key={k}
                          className="group relative flex items-center justify-center text-[10px] font-bold"
                          style={{ width: `${pct}%`, backgroundColor: t.primary }}
                          title={`${t.label}: ${v}`}
                        >
                          {pct > 10 && <span className="text-ink-950 mix-blend-multiply">{v}</span>}
                        </div>
                      )
                    })}
                    {/* Unassessed segment */}
                    {d.total - d.assessed > 0 && (
                      <div
                        className="bg-white/[0.04]"
                        style={{ width: `${((d.total - d.assessed) / d.total) * 100 / (d.assessed / d.total + (d.total - d.assessed) / d.total) * 100}%` }}
                        title={`ยังไม่ประเมิน: ${d.total - d.assessed}`}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryTile({
  label, value, accent = '#94A3B8', icon,
}: {
  label: string
  value: number
  accent?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="absolute inset-0 opacity-[0.16]"
        style={{ background: `radial-gradient(circle at 90% 0%, ${accent}, transparent 60%)` }} />
      <div className="relative">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500">{label}</span>
          {icon && (
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white/[0.05]" style={{ color: accent }}>
              {icon}
            </span>
          )}
        </div>
        <div className="font-display text-3xl font-bold text-white">{value.toLocaleString('en-US')}</div>
      </div>
    </div>
  )
}
