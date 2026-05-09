import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import axios from 'axios'
import { ARCHETYPES } from '../lib/archetypes'
import type { Archetype } from '../api/client'
import ThemeToggle from '../components/ThemeToggle'

// Public client — no credentials needed
const publicApi = axios.create({ baseURL: '/api/public' })

type PublicQuestion = {
  id: string
  text: string
  axis: 'SKILL' | 'WILL'
  order: number
}

type TakeData = {
  employee: {
    id: string
    fullName: string
    position: string
    department: string
    photoPath: string | null
  }
  expiresAt: string
  questions: PublicQuestion[]
}

type SubmitResult = {
  ok: true
  archetype: Archetype
  skillScore: number
  willScore: number
}

const LIKERT = [
  { value: 1, label: 'ไม่จริงเลย', color: '#F87171' },
  { value: 2, label: 'ค่อนข้างไม่จริง', color: '#FB923C' },
  { value: 3, label: 'กลาง ๆ', color: '#FCD34D' },
  { value: 4, label: 'ค่อนข้างจริง', color: '#86EFAC' },
  { value: 5, label: 'จริงมาก', color: '#4ADE80' },
]

const TOKEN_ERRORS: Record<string, { title: string; detail: string }> = {
  TOKEN_NOT_FOUND: { title: 'ลิงก์ไม่ถูกต้อง', detail: 'กรุณาตรวจสอบลิงก์ที่ได้รับอีกครั้ง หรือติดต่อ HR เพื่อขอลิงก์ใหม่' },
  TOKEN_REVOKED: { title: 'ลิงก์ถูกยกเลิกแล้ว', detail: 'ลิงก์นี้ถูกยกเลิกโดย HR กรุณาติดต่อเพื่อขอลิงก์ใหม่' },
  TOKEN_ALREADY_USED: { title: 'ลิงก์ถูกใช้งานแล้ว', detail: 'การประเมินนี้ถูกส่งเรียบร้อยแล้ว' },
  TOKEN_EXPIRED: { title: 'ลิงก์หมดอายุ', detail: 'กรุณาติดต่อ HR เพื่อขอลิงก์ใหม่' },
  EMPLOYEE_ARCHIVED: { title: 'บัญชีพนักงานถูกระงับ', detail: 'บัญชีพนักงานคนนี้ถูกระงับในระบบแล้ว' },
}

export default function PublicAssessment() {
  const { token } = useParams<{ token: string }>()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const { data, isLoading, error } = useQuery<TakeData>({
    queryKey: ['public-take', token],
    queryFn: async () => (await publicApi.get(`/take/${token}`)).data,
    enabled: !!token,
    retry: false,
  })

  const sortedQuestions = useMemo(
    () => (data ? [...data.questions].sort((a, b) => a.order - b.order) : []),
    [data]
  )
  const total = sortedQuestions.length
  const current = sortedQuestions[step]

  const submitMut = useMutation({
    mutationFn: async () => {
      const r = await publicApi.post<SubmitResult>(`/take/${token}`, {
        answers: sortedQuestions.map((q) => ({
          questionId: q.id,
          value: answers[q.id] ?? 3,
        })),
      })
      return r.data
    },
    onSuccess: (data) => setResult(data),
  })

  function pick(value: number) {
    if (!current) return
    setAnswers((a) => ({ ...a, [current.id]: value }))
    setTimeout(() => {
      if (step < total - 1) setStep(step + 1)
      else submitMut.mutate()
    }, 220)
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  useEffect(() => {
    if (!started || result) return
    function onKey(e: KeyboardEvent) {
      if (e.key >= '1' && e.key <= '5') pick(Number(e.key))
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── Error states ─────────────────────────────────────────────────
  if (error) {
    const code = (error as any)?.response?.data?.error as string | undefined
    const info = (code && TOKEN_ERRORS[code]) || {
      title: 'เกิดข้อผิดพลาด',
      detail: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้งหรือติดต่อ HR',
    }
    return <ErrorScreen title={info.title} detail={info.detail} />
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading || !data) {
    return (
      <PublicShell>
        <div className="grid min-h-[60vh] place-items-center text-sm text-ink-500">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </PublicShell>
    )
  }

  // ── Submitted ─────────────────────────────────────────────────────
  if (result) {
    return <PublicResult result={result} employeeName={data.employee.fullName} />
  }

  // ── Intro screen ──────────────────────────────────────────────────
  if (!started) {
    return (
      <PublicShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-xl"
        >
          <div className="panel p-8 sm:p-10">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300/80">
              TAS · Self-Assessment
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight text-white">
              สวัสดี, {data.employee.fullName}
            </h1>
            <p className="mt-1 text-sm text-ink-400">
              {data.employee.position} · {data.employee.department}
            </p>

            <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="space-y-3.5 text-sm leading-relaxed text-ink-200">
              <p>
                คุณได้รับเชิญให้ทำแบบประเมินตนเองเพื่อช่วยให้บริษัทเข้าใจ
                ทักษะและแรงจูงใจของคุณได้ดียิ่งขึ้น
              </p>
              <ul className="space-y-2 pl-4 text-ink-300">
                <li className="list-disc">มีทั้งหมด <strong className="text-white">{total} ข้อ</strong></li>
                <li className="list-disc">ใช้เวลาประมาณ <strong className="text-white">5–8 นาที</strong></li>
                <li className="list-disc">ไม่มีคำตอบถูก/ผิด — ตอบตามความเป็นจริงจะดีที่สุด</li>
              </ul>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="btn-primary mt-8 w-full py-3 text-base"
            >
              เริ่มทำแบบประเมิน
            </button>
            <div className="mt-3 text-center text-[11px] text-ink-600">
              ลิงก์นี้ใช้งานได้ครั้งเดียว · หมดอายุ {new Date(data.expiresAt).toLocaleDateString('th-TH')}
            </div>
          </div>
        </motion.div>
      </PublicShell>
    )
  }

  // ── Active assessment ─────────────────────────────────────────────
  const progress = ((step + 1) / total) * 100
  const axisColor = current?.axis === 'SKILL' ? '#60A5FA' : '#C084FC'

  return (
    <PublicShell>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xs text-ink-500">
          {data.employee.fullName} · ข้อ{' '}
          <span className="font-bold text-ink-200">{step + 1}</span>
          <span className="text-ink-600"> / {total}</span>
        </div>
        <div className="text-[11px] text-ink-600">{Math.round(progress)}%</div>
      </div>

      {/* Progress */}
      <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-ink-800/80">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #F59E0B 0%, #A855F7 50%, #3B82F6 100%)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="grid place-items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8"
              style={{
                background: `linear-gradient(155deg, ${axisColor}1A 0%, rgba(7,9,15,0.97) 55%, rgba(7,9,15,1) 100%)`,
                boxShadow: `0 0 0 1px ${axisColor}28, 0 28px 64px -20px ${axisColor}44`,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${axisColor}66, transparent)` }}
              />
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ backgroundColor: `${axisColor}1A`, color: axisColor }}
              >
                {current.axis === 'SKILL' ? '⚡ Skill Axis' : '🔥 Will Axis'}
              </div>
              <p className="font-display text-2xl font-bold leading-relaxed" style={{ color: '#FFFFFF' }}>{current.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 grid w-full max-w-xl grid-cols-5 gap-2.5">
          {LIKERT.map((l) => {
            const selected = answers[current.id] === l.value
            return (
              <motion.button
                key={l.value}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => pick(l.value)}
                className="relative overflow-hidden rounded-xl px-2 py-4 text-center transition-all"
                style={{
                  backgroundColor: selected ? `${l.color}22` : 'var(--overlay-soft)',
                  boxShadow: selected
                    ? `0 0 0 2px ${l.color}, 0 8px 24px -8px ${l.color}66`
                    : 'inset 0 0 0 1px var(--panel-border)',
                }}
              >
                <div className="font-display text-2xl font-bold" style={{ color: l.color }}>
                  {l.value}
                </div>
                <div className="mt-1 text-[10px] leading-snug text-ink-500">{l.label}</div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center gap-4 text-xs text-ink-600">
          <span>⌨ กดเลข 1–5 เพื่อเลือก</span>
          {step > 0 && (
            <button onClick={back} className="btn-ghost btn-sm text-ink-600">
              <ArrowLeft size={11} /> ย้อนกลับ
            </button>
          )}
        </div>

        {submitMut.isPending && (
          <div className="mt-8 flex items-center gap-2 text-sm text-amber-300">
            <Loader2 className="animate-spin" size={15} /> กำลังบันทึกผลการประเมิน…
          </div>
        )}
        {submitMut.isError && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
            ส่งไม่สำเร็จ — กรุณาลองใหม่อีกครั้ง
          </div>
        )}
      </div>
    </PublicShell>
  )
}

// ── Layout shell — clean, no admin chrome ───────────────────────────
function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-5 py-10 sm:px-8 md:py-16">
      <div className="mx-auto mb-10 flex max-w-3xl items-center gap-3">
        <div
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 via-purple-500 to-blue-500 font-display text-base font-bold"
          style={{ color: '#FFFFFF' }}
        >
          T
        </div>
        <div>
          <div className="font-display text-base font-bold tracking-wide text-amber-400">TAS Cards</div>
          <div className="text-[11px] text-ink-500">Self-Assessment Portal</div>
        </div>
        <div className="ml-auto">
          <ThemeToggle compact />
        </div>
      </div>
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  )
}

// ── Error screen ─────────────────────────────────────────────────────
function ErrorScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <PublicShell>
      <div className="mx-auto max-w-md panel p-8 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-500/15 text-red-300">
          <AlertTriangle size={26} />
        </div>
        <h1 className="font-display text-xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{detail}</p>
      </div>
    </PublicShell>
  )
}

// ── Result screen ────────────────────────────────────────────────────
function PublicResult({ result, employeeName }: { result: SubmitResult; employeeName: string }) {
  const t = ARCHETYPES[result.archetype]
  return (
    <PublicShell>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-md text-center"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 size={26} />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">บันทึกเรียบร้อย</h1>
        <p className="mt-2 text-sm text-ink-400">
          ขอบคุณ {employeeName} สำหรับการทำแบบประเมิน
        </p>

        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mx-auto mt-8 mb-2 flex h-32 w-32 items-center justify-center rounded-full"
          style={{
            background: `radial-gradient(circle, ${t.primary}44, transparent 70%)`,
            boxShadow: `0 0 80px ${t.primary}55`,
          }}
        >
          <Sparkles size={40} style={{ color: t.primary }} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-4 font-display text-4xl font-bold tracking-tight"
          style={{ color: t.primary, textShadow: `0 0 40px ${t.primary}66` }}
        >
          {t.label}
        </motion.h2>
        <p className="mt-1 text-sm text-ink-400">{t.tagline}</p>

        <div className="mt-6 flex justify-center gap-8 text-sm">
          <div className="text-ink-500">
            Skill <span className="ml-1 font-display text-xl font-bold text-blue-400">{result.skillScore.toFixed(0)}</span>
          </div>
          <div className="text-ink-500">
            Will <span className="ml-1 font-display text-xl font-bold text-purple-400">{result.willScore.toFixed(0)}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-ink-600">
          ผลประเมินถูกส่งให้ HR แล้ว · คุณสามารถปิดหน้าต่างนี้ได้
        </p>
      </motion.div>
    </PublicShell>
  )
}
