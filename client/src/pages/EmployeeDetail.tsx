import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Pencil, Sparkles, Loader2, Download, Play, RotateCw } from 'lucide-react'
import { api, type Employee, type Assessment } from '../api/client'
import EmployeeCard from '../components/cards/EmployeeCard'
import ArchetypeBadge from '../components/cards/ArchetypeBadge'
import PageHeader from '../components/layout/PageHeader'
import { ARCHETYPES } from '../lib/archetypes'
import StatBar from '../components/cards/StatBar'

export default function EmployeeDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get<Employee & { assessments: Assessment[] }>(`/employees/${id}`)).data,
    enabled: !!id,
  })

  const latest = (employee as any)?.latest as Assessment | undefined
  const history = (employee as any)?.assessments as Assessment[] | undefined
  const theme = latest ? ARCHETYPES[latest.archetype] : null

  const aiMut = useMutation({
    mutationFn: async (regenerate: boolean) => {
      setAiBusy(true)
      setAiError(null)
      try {
        const r = await api.post('/ai/dev-plan', { assessmentId: latest!.id, regenerate })
        return r.data.plan as string
      } finally {
        setAiBusy(false)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee', id] }),
    onError: (e: any) => setAiError(e?.response?.data?.error || 'AI ใช้งานไม่ได้'),
  })

  if (isLoading || !employee) return <div className="text-ink-400">Loading…</div>

  return (
    <div>
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.position} · ${employee.department}`}
        actions={
          <>
            <Link to="/roster" className="btn-ghost"><ArrowLeft size={16} /> กลับ</Link>
            <a className="btn-secondary" href={`/api/export/employee/${employee.id}.pdf`} target="_blank" rel="noreferrer">
              <Download size={16} /> PDF
            </a>
            <Link to={`/employees/${employee.id}/edit`} className="btn-secondary">
              <Pencil size={16} /> แก้ไข
            </Link>
            <Link to={`/employees/${employee.id}/assess`} className="btn-primary">
              <Play size={16} /> ประเมิน
            </Link>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
        <div className="flex justify-center">
          <EmployeeCard employee={employee} size="lg" />
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink-50">สถานะปัจจุบัน</h2>
              {latest && <ArchetypeBadge archetype={latest.archetype} size="lg" />}
            </div>
            {latest ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <StatBar label="Skill" value={latest.skillScore} color="#3B82F6" />
                  <StatBar label="Will" value={latest.willScore} color="#A855F7" />
                </div>
                <div className="rounded-lg border border-white/5 bg-ink-900/40 p-4">
                  <div className="text-sm font-semibold text-ink-200 mb-1" style={{ color: theme?.primary }}>
                    {theme?.tagline}
                  </div>
                  <p className="text-sm text-ink-400">{theme?.description}</p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-ink-400">
                ยังไม่มีผลประเมิน — กดปุ่ม "ประเมิน" เพื่อเริ่ม
              </div>
            )}
          </div>

          {latest && (
            <div className="panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-ink-50">แผนพัฒนา (AI)</h2>
                <div className="flex items-center gap-2">
                  {latest.aiPlan && (
                    <button
                      onClick={() => aiMut.mutate(true)}
                      className="btn-ghost text-xs"
                      disabled={aiBusy}
                    >
                      <RotateCw size={14} /> Regenerate
                    </button>
                  )}
                  <button
                    onClick={() => aiMut.mutate(false)}
                    className="btn-secondary text-sm"
                    disabled={aiBusy}
                  >
                    {aiBusy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {latest.aiPlan ? 'ดูแผน' : 'สร้างแผน'}
                  </button>
                </div>
              </div>
              {aiError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {aiError}
                </div>
              )}
              <AnimatePresence>
                {latest.aiPlan && (
                  <motion.article
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-sm prose-invert max-w-none text-ink-200 [&_h2]:font-display [&_h2]:text-amber-300 [&_h2]:mt-6 [&_h2]:mb-2 [&_li]:my-1"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.aiPlan}</ReactMarkdown>
                  </motion.article>
                )}
              </AnimatePresence>
            </div>
          )}

          {history && history.length > 0 && (
            <div className="panel p-6">
              <h2 className="font-display text-xl font-bold text-ink-50 mb-4">ประวัติการประเมิน</h2>
              <div className="space-y-2">
                {history.map((h) => {
                  const t = ARCHETYPES[h.archetype]
                  return (
                    <div key={h.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-ink-900/40 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-ink-500">
                          {new Date(h.takenAt).toISOString().slice(0, 10)}
                        </span>
                        <ArchetypeBadge archetype={h.archetype} size="sm" />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-ink-400">
                        <span>S {h.skillScore.toFixed(0)}</span>
                        <span>W {h.willScore.toFixed(0)}</span>
                        <span style={{ color: t.primary }}>● {h.takenBy?.username || '—'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {employee.notes && (
            <div className="panel p-6">
              <h2 className="font-display text-lg font-bold text-ink-50 mb-2">หมายเหตุ</h2>
              <p className="text-sm text-ink-300 whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
