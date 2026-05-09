import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Loader2, Mail, X, Trash2, ExternalLink, Plus } from 'lucide-react'
import { api, type AssessmentToken } from '../api/client'

export default function SendInviteModal({
  open,
  onClose,
  employeeId,
  employeeName,
}: {
  open: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
}) {
  const qc = useQueryClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [days, setDays] = useState(14)

  const { data: tokens = [], isLoading } = useQuery<AssessmentToken[]>({
    queryKey: ['tokens', employeeId],
    queryFn: async () =>
      (await api.get<AssessmentToken[]>('/assessment-tokens', { params: { employeeId } })).data,
    enabled: open,
  })

  const create = useMutation({
    mutationFn: async () =>
      (await api.post<AssessmentToken>('/assessment-tokens', { employeeId, expiresInDays: days })).data,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ['tokens', employeeId] })
      const link = buildLink(t.token)
      navigator.clipboard.writeText(link).catch(() => {})
      setCopiedId(t.id)
      setTimeout(() => setCopiedId(null), 2000)
    },
  })

  const revoke = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/assessment-tokens/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tokens', employeeId] }),
  })

  function buildLink(token: string) {
    return `${window.location.origin}/take/${token}`
  }

  function copy(t: AssessmentToken) {
    navigator.clipboard.writeText(buildLink(t.token)).catch(() => {})
    setCopiedId(t.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100vw-2rem))] max-h-[85vh]
                       -translate-x-1/2 -translate-y-1/2 panel p-6 overflow-y-auto"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-1 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Mail size={11} /> Self-Assessment
                </div>
                <h2 className="font-display text-xl font-bold text-white">ส่งลิงก์ประเมินให้พนักงาน</h2>
                <p className="mt-1 text-sm text-ink-400">
                  สร้างลิงก์ที่ใช้ได้ครั้งเดียวเพื่อให้ <span className="text-ink-200">{employeeName}</span> ทำประเมินตนเอง
                </p>
              </div>
              <button onClick={onClose} className="btn-ghost btn-sm">
                <X size={14} />
              </button>
            </div>

            {/* Generate new */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">อายุการใช้งาน (วัน)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(90, Number(e.target.value) || 14)))}
                    className="input"
                  />
                </div>
                <button
                  onClick={() => create.mutate()}
                  disabled={create.isPending}
                  className="btn-primary"
                >
                  {create.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  สร้างลิงก์ใหม่
                </button>
              </div>
              <p className="text-[11px] text-ink-600">
                ลิงก์ใหม่จะถูกคัดลอกอัตโนมัติเข้าคลิปบอร์ด ลิงก์เก่าที่ยังไม่ใช้จะยังใช้งานได้
              </p>
            </div>

            {/* Existing tokens */}
            <div className="mt-5">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                ลิงก์ที่มีอยู่
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-16" />)}
                </div>
              ) : tokens.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.06] py-8 text-center text-sm text-ink-600">
                  ยังไม่มีลิงก์ — กดปุ่ม "สร้างลิงก์ใหม่" ด้านบน
                </div>
              ) : (
                <div className="space-y-2">
                  {tokens.map((t) => {
                    const status = getStatus(t)
                    const link = buildLink(t.token)
                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: status.bg,
                              color: status.fg,
                            }}
                          >
                            {status.label}
                          </span>
                          <span className="text-[10px] text-ink-600">
                            สร้าง {new Date(t.createdAt).toLocaleDateString('th-TH')} · หมดอายุ{' '}
                            {new Date(t.expiresAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            value={link}
                            className="input flex-1 font-mono text-[11px] py-1.5"
                            onFocus={(e) => e.target.select()}
                          />
                          {status.canUse && (
                            <button
                              onClick={() => copy(t)}
                              className="btn-secondary btn-sm shrink-0"
                              title="คัดลอกลิงก์"
                            >
                              {copiedId === t.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          )}
                          {status.canUse && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary btn-sm shrink-0"
                              title="เปิดลิงก์"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          {status.canUse && (
                            <button
                              onClick={() => revoke.mutate(t.id)}
                              className="btn-ghost btn-sm shrink-0 text-red-300/70 hover:text-red-300 hover:bg-red-500/10"
                              title="ยกเลิก"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function getStatus(t: AssessmentToken): {
  label: string
  bg: string
  fg: string
  canUse: boolean
} {
  if (t.usedAt) return { label: 'ใช้แล้ว', bg: 'rgba(74,222,128,0.12)', fg: '#86EFAC', canUse: false }
  if (t.revoked) return { label: 'ยกเลิก', bg: 'rgba(248,113,113,0.12)', fg: '#FCA5A5', canUse: false }
  if (new Date(t.expiresAt) < new Date()) {
    return { label: 'หมดอายุ', bg: 'rgba(100,116,139,0.18)', fg: '#94A3B8', canUse: false }
  }
  return { label: 'ใช้งานได้', bg: 'rgba(245,158,11,0.15)', fg: '#FCD34D', canUse: true }
}
