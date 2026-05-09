import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api, type Archetype } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import PageHeader from '../components/layout/PageHeader'

type ByDept = Record<string, Record<Archetype, number> & { total: number }>

const ARCHETYPE_KEYS: Archetype[] = ['DELEGATE', 'COACH', 'INSPIRE_SUPPORT', 'TELL']

export default function Analytics() {
  const { data: byDept = {} } = useQuery({
    queryKey: ['analytics', 'by-department'],
    queryFn: async () => (await api.get<ByDept>('/analytics/by-department')).data,
  })

  const departments = Object.keys(byDept).sort()
  const max = Math.max(1, ...Object.values(byDept).map((v) => v.total))

  return (
    <div>
      <PageHeader title="Analytics" subtitle="วิเคราะห์การกระจายของ archetype ในแต่ละแผนก" />

      <div className="panel p-6">
        {/* Legend */}
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-white/[0.06] pb-5">
          {ARCHETYPE_KEYS.map((k) => (
            <span key={k} className="inline-flex items-center gap-2 text-xs font-semibold text-ink-400">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ARCHETYPES[k].primary }} />
              {ARCHETYPES[k].label}
            </span>
          ))}
        </div>

        {departments.length === 0 ? (
          <div className="grid place-items-center py-14 text-sm text-ink-600">
            ยังไม่มีข้อมูลแผนก
          </div>
        ) : (
          <div className="space-y-5">
            {departments.map((dept, di) => {
              const row = byDept[dept]
              return (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink-100">{dept}</div>
                    <div className="text-xs text-ink-600">{row.total} คน</div>
                  </div>
                  <div className="flex h-7 overflow-hidden rounded-lg bg-ink-900/60 ring-1 ring-white/[0.05]">
                    {ARCHETYPE_KEYS.map((k) => {
                      const v = row[k]
                      const pct = (v / max) * 100
                      if (pct === 0) return null
                      const t = ARCHETYPES[k]
                      return (
                        <div
                          key={k}
                          className="group relative flex items-center justify-center text-[10px] font-bold transition-all"
                          style={{ width: `${pct}%`, backgroundColor: t.primary }}
                          title={`${t.label}: ${v}`}
                        >
                          <span className="text-ink-950 mix-blend-multiply">
                            {pct > 8 ? v : ''}
                          </span>
                        </div>
                      )
                    })}
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
