import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Download } from 'lucide-react'
import { api, type Employee, type Archetype } from '../api/client'
import EmployeeCard from '../components/cards/EmployeeCard'
import PageHeader from '../components/layout/PageHeader'
import { ARCHETYPES } from '../lib/archetypes'

const ARCHETYPE_KEYS: (Archetype | 'ALL')[] = ['ALL', 'DELEGATE', 'COACH', 'INSPIRE_SUPPORT', 'TELL']

export default function Roster() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Archetype | 'ALL'>('ALL')

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => (await api.get<Employee[]>('/employees')).data,
  })

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (filter !== 'ALL' && e.latest?.archetype !== filter) return false
      if (search && !`${e.fullName} ${e.position} ${e.department}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [employees, filter, search])

  return (
    <div>
      <PageHeader
        title="Roster"
        subtitle="ทีมของคุณในรูปแบบสำรับการ์ด"
        actions={
          <>
            <a className="btn-secondary" href="/api/export/employees.xlsx" download>
              <Download size={16} /> XLSX
            </a>
            <Link to="/employees/new" className="btn-primary">
              <Plus size={16} /> เพิ่มพนักงาน
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="input pl-9 w-72"
            placeholder="ค้นหาชื่อ / ตำแหน่ง / แผนก…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/5 bg-ink-900/60 p-1">
          {ARCHETYPE_KEYS.map((k) => {
            const isActive = filter === k
            const t = k === 'ALL' ? null : ARCHETYPES[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition"
                style={{
                  backgroundColor: isActive ? (t ? t.primary + '33' : 'rgba(245,158,11,0.2)') : 'transparent',
                  color: isActive ? (t ? t.primary : '#FCD34D') : '#94A3B8',
                  boxShadow: isActive && t ? `inset 0 0 0 1px ${t.primary}55` : undefined,
                }}
              >
                {k === 'ALL' ? 'ทั้งหมด' : t!.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto text-sm text-ink-400">{filtered.length} / {employees.length} คน</div>
      </div>

      {isLoading ? (
        <div className="text-ink-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-white/10 p-16 text-ink-500">
          ยังไม่มีข้อมูล — เริ่มด้วยการเพิ่มพนักงานคนแรก
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/employees/${e.id}`} className="block focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-ink-950 rounded-2xl">
                <EmployeeCard employee={e} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
