import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Pencil, Sparkles, Loader2, Download, Play, RotateCw, Calendar, Send } from 'lucide-react'
import { api, type Employee, type Assessment } from '../api/client'
import EmployeeCard from '../components/cards/EmployeeCard'
import ArchetypeBadge from '../components/cards/ArchetypeBadge'
import PageHeader from '../components/layout/PageHeader'
import { ARCHETYPES } from '../lib/archetypes'
import StatBar from '../components/cards/StatBar'
import SendInviteModal from '../components/SendInviteModal'

export default function EmployeeDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

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

  if (isLoading || !employee) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <div className="skeleton h-[440px] rounded-[20px]" />
          <div className="space-y-4">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.position} · ${employee.department}`}
        actions={
          <>
            <Link to="/roster" className="btn-ghost"><ArrowLeft size={15} /> กลับ</Link>
            <a className="btn-secondary" href={`/api/export/employee/${employee.id}.pdf`} target="_blank" rel="noreferrer">
              <Download size={15} /> PDF
            </a>
            <Link to={`/employees/${employee.id}/edit`} className="btn-secondary">
              <Pencil size={15} /> แก้ไข
            </Link>
            <button onClick={() => setInviteOpen(true)} className="btn-secondary">
              <Send size={15} /> ส่งลิงก์ประเมิน
            </button>
            <Link to={`/employees/${employee.id}/assess`} className="btn-primary">
              <Play size={15} /> ประเมินด้วยตัวเอง
            </Link>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
        {/* Card */}
        <div className="flex justify-center lg:justify-start">
          <EmployeeCard employee={employee} size="lg" />
        </div>

        <div className="space-y-5">
          {/* Current status */}
          <div className="panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">สถานะปัจจุบัน</h2>
              {latest && <ArchetypeBadge archetype={latest.archetype} size="lg" />}
            </div>
            {latest ? (
              <>
                <div className="mb-5 grid grid-cols-2 gap-5">
                  <StatBar label="Skill" value={latest.skillScore} color="#60A5FA" />
                  <StatBar label="Will"  value={latest.willScore}  color="#C084FC" />
                </div>
                <div
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: `${theme?.primary}33`,
                    background: `${theme?.primary}0A`,
                  }}
                >
                  <div className="mb-1 text-sm font-bold" style={{ color: theme?.primary }}>
                    {theme?.tagline}
                  </div>
                  <p className="text-sm leading-relaxed text-ink-400">{theme?.description}</p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.07] p-6 text-center text-sm text-ink-600">
                ยังไม่มีผลประเมิน — กดปุ่ม "ประเมิน" เพื่อเริ่ม
              </div>
            )}
          </div>

          {/* AI plan */}
          {latest && (
            <div className="panel p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white">แผนพัฒนา (AI)</h2>
                <div className="flex items-center gap-2">
                  {latest.aiPlan && (
                    <button onClick={() => aiMut.mutate(true)} className="btn-ghost btn-sm" disabled={aiBusy}>
                      <RotateCw size={13} /> Regenerate
                    </button>
                  )}
                  <button onClick={() => aiMut.mutate(false)} className="btn-secondary btn-sm" disabled={aiBusy}>
                    {aiBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    {latest.aiPlan ? 'ดูแผน' : 'สร้างแผน'}
                  </button>
                </div>
              </div>
              {aiError && (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300">
                  {aiError}
                </div>
              )}
              <AnimatePresence>
                {latest.aiPlan && (
                  <motion.article
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-sm prose-invert max-w-none text-ink-300
                               [&_h2]:font-display [&_h2]:text-amber-300 [&_h2]:mt-6 [&_h2]:mb-2
                               [&_h3]:text-ink-100 [&_h3]:mt-4 [&_h3]:mb-1
                               [&_li]:my-0.5 [&_li]:text-ink-400
                               [&_strong]:text-ink-100"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.aiPlan}</ReactMarkdown>
                  </motion.article>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* History */}
          {history && history.length > 0 && (
            <div className="panel p-6">
              <h2 className="font-display text-lg font-bold text-white mb-5">ประวัติการประเมิน</h2>
              <div className="space-y-2">
                {history.map((h, i) => {
                  const t = ARCHETYPES[h.archetype]
                  const isLatest = i === 0
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 transition hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={13} className="shrink-0 text-ink-600" />
                        <span className="font-mono text-xs text-ink-500">
                          {new Date(h.takenAt).toISOString().slice(0, 10)}
                        </span>
                        <ArchetypeBadge archetype={h.archetype} size="sm" />
                        {isLatest && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                            ล่าสุด
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-ink-500">
                        <span>S <span className="text-blue-400 font-semibold">{h.skillScore.toFixed(0)}</span></span>
                        <span>W <span className="text-purple-400 font-semibold">{h.willScore.toFixed(0)}</span></span>
                        <span style={{ color: t.primary }}>● {(h as any).takenBy?.username || '—'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {employee.notes && (
            <div className="panel p-6">
              <h2 className="font-display text-base font-bold text-white mb-3">หมายเหตุ</h2>
              <p className="text-sm leading-relaxed text-ink-400 whitespace-pre-wrap">{employee.notes}</p>
            </div>
          )}
        </div>
      </div>

      <SendInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        employeeId={employee.id}
        employeeName={employee.fullName}
      />
    </div>
  )
}
