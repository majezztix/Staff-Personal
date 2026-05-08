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
        <div className="mb-6 flex items-center gap-4 text-xs">
          {ARCHETYPE_KEYS.map((k) => (
            <span key={k} className="inline-flex items-center gap-2 text-ink-300">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: ARCHETYPES[k].primary }} />
              {ARCHETYPES[k].label}
            </span>
          ))}
        </div>

        {departments.length === 0 ? (
          <div className="grid place-items-center py-12 text-ink-500">ยังไม่มีข้อมูลแผนก</div>
        ) : (
          <div className="space-y-4">
            {departments.map((dept, di) => {
              const row = byDept[dept]
              return (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: di * 0.04 }}
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="font-bold text-ink-100">{dept}</div>
                    <div className="text-ink-500">{row.total} คน</div>
                  </div>
                  <div className="flex h-6 overflow-hidden rounded-md ring-1 ring-white/5 bg-ink-900/60">
                    {ARCHETYPE_KEYS.map((k) => {
                      const v = row[k]
                      const pct = (v / max) * 100
                      if (pct === 0) return null
                      const t = ARCHETYPES[k]
                      return (
                        <div
                          key={k}
                          className="flex items-center justify-center text-[10px] font-bold text-ink-950 transition"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: t.primary,
                          }}
                          title={`${t.label}: ${v}`}
                        >
                          {pct > 8 ? v : ''}
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
