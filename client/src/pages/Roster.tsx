import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Download, LayoutGrid } from 'lucide-react'
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
              <Download size={15} /> XLSX
            </a>
            <Link to="/employees/new" className="btn-primary">
              <Plus size={15} /> เพิ่มพนักงาน
            </Link>
          </>
        }
      />

      {/* ── Filter bar ─────────────────────────────────── */}
      <div className="mb-7 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-600" />
          <input
            className="input pl-9 w-72 py-2"
            placeholder="ค้นหาชื่อ / ตำแหน่ง / แผนก…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* archetype filter pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.06] bg-ink-900/40 p-1">
          {ARCHETYPE_KEYS.map((k) => {
            const isActive = filter === k
            const t = k === 'ALL' ? null : ARCHETYPES[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-150"
                style={{
                  backgroundColor: isActive
                    ? t ? `${t.primary}22` : 'rgba(245,158,11,0.18)'
                    : 'transparent',
                  color: isActive ? (t ? t.primary : '#FCD34D') : '#64748B',
                  boxShadow: isActive && t ? `inset 0 0 0 1px ${t.primary}44` : undefined,
                }}
              >
                {k === 'ALL' ? 'ทั้งหมด' : t!.label}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-600">
          <LayoutGrid size={13} />
          {filtered.length} / {employees.length} คน
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[380px] skeleton rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-white/[0.07] p-16 text-sm text-ink-600">
          {employees.length === 0
            ? 'ยังไม่มีข้อมูล — เริ่มด้วยการเพิ่มพนักงานคนแรก'
            : 'ไม่พบพนักงานที่ตรงกับเงื่อนไข'}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={`/employees/${e.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-2 focus:ring-offset-ink-950 rounded-[20px]"
              >
                <EmployeeCard employee={e} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
