import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { api, type Question, type Employee, type Assessment } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import ArchetypeBadge from '../components/cards/ArchetypeBadge'

const LIKERT = [
  { value: 1, label: 'ไม่จริงเลย',       color: '#F87171' },
  { value: 2, label: 'ค่อนข้างไม่จริง',  color: '#FB923C' },
  { value: 3, label: 'กลาง ๆ',            color: '#FCD34D' },
  { value: 4, label: 'ค่อนข้างจริง',      color: '#86EFAC' },
  { value: 5, label: 'จริงมาก',           color: '#4ADE80' },
]

export default function Assessment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<Assessment | null>(null)

  const { data: employee } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get<Employee>(`/employees/${id}`)).data,
    enabled: !!id,
  })

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => (await api.get<Question[]>('/questions')).data,
  })

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions])
  const total = sortedQuestions.length
  const current = sortedQuestions[step]

  const submitMut = useMutation({
    mutationFn: async () => {
      const r = await api.post<Assessment>('/assessments', {
        employeeId: id,
        answers: sortedQuestions.map((q) => ({ questionId: q.id, value: answers[q.id] || 3 })),
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
    }, 260)
  }

  function back() {
    if (step > 0) setStep(step - 1)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (result) return
      if (e.key >= '1' && e.key <= '5') pick(Number(e.key))
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (isLoading || !current) {
    return <div className="grid place-items-center py-20 text-sm text-ink-600">Loading…</div>
  }

  if (result) {
    return (
      <ResultReveal
        result={result}
        employeeName={employee?.fullName || ''}
        onDone={() => navigate(`/employees/${id}`)}
      />
    )
  }

  const progress = ((step + 1) / total) * 100
  const axisColor = current.axis === 'SKILL' ? '#60A5FA' : '#C084FC'

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(`/employees/${id}`)} className="btn-ghost btn-sm">
          <ArrowLeft size={14} /> ออก
        </button>
        <div className="text-xs text-ink-500">
          {employee?.fullName} · ข้อ{' '}
          <span className="font-bold text-ink-200">{step + 1}</span>
          <span className="text-ink-600"> / {total}</span>
        </div>
        <div className="w-20" />
      </div>

      {/* Progress */}
      <div className="mb-10 space-y-1.5">
        <div className="flex justify-between text-[10px] text-ink-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-800/80">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #F59E0B 0%, #A855F7 50%, #3B82F6 100%)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid place-items-center">
        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50, rotateY: 20 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -50, rotateY: -20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: 1200 }}
            className="w-full max-w-xl"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8"
              style={{
                background: `linear-gradient(155deg, ${axisColor}1A 0%, rgba(7,9,15,0.97) 55%, rgba(7,9,15,1) 100%)`,
                boxShadow: `0 0 0 1px ${axisColor}28, 0 28px 64px -20px ${axisColor}44`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[1px]"
                style={{ background: `linear-gradient(90deg, transparent, ${axisColor}66, transparent)` }} />

              <div
                className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ backgroundColor: `${axisColor}1A`, color: axisColor }}
              >
                {current.axis === 'SKILL' ? '⚡ Skill Axis' : '🔥 Will Axis'}
              </div>
              <p className="font-display text-2xl font-bold leading-relaxed text-white">
                {current.text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Likert cards */}
        <div className="mt-6 grid grid-cols-5 gap-2.5 w-full max-w-xl">
          {LIKERT.map((l) => {
            const selected = answers[current.id] === l.value
            return (
              <motion.button
                key={l.value}
                whileHover={{ y: -5, scale: 1.03 }}
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
          <span>⌨ กดเลข 1-5 เพื่อเลือก</span>
          {step > 0 && (
            <button onClick={back} className="btn-ghost btn-sm text-ink-600">
              <ArrowLeft size={11} /> ย้อนกลับ
            </button>
          )}
        </div>

        {submitMut.isPending && (
          <div className="mt-8 flex items-center gap-2 text-sm text-amber-300">
            <Loader2 className="animate-spin" size={15} /> กำลังคำนวณผล…
          </div>
        )}
      </div>
    </div>
  )
}

function ResultReveal({
  result,
  employeeName,
  onDone,
}: {
  result: Assessment
  employeeName: string
  onDone: () => void
}) {
  const t = ARCHETYPES[result.archetype]

  return (
    <div className="grid min-h-[75vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-ink-600"
        >
          Result
        </motion.div>

        <motion.div
          initial={{ rotateY: 180, opacity: 0, scale: 0.8 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-8 flex h-44 w-44 items-center justify-center rounded-full ring-2"
          style={{
            background: `radial-gradient(circle, ${t.primary}44, transparent 70%)`,
            boxShadow: `0 0 100px ${t.primary}55, 0 0 40px ${t.primary}33`,
            borderColor: `${t.primary}66`,
          }}
        >
          <Sparkles size={52} style={{ color: t.primary }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="font-display text-6xl font-bold tracking-tight"
          style={{ color: t.primary, textShadow: `0 0 40px ${t.primary}66` }}
        >
          {t.label}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-3 text-base text-ink-200"
        >
          {employeeName} · <span className="text-ink-500">{t.tagline}</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.95 }}
          className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500"
        >
          {t.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-6 flex justify-center gap-8 text-sm"
        >
          <div className="text-ink-500">
            Skill <span className="ml-1 font-display text-xl font-bold text-blue-400">{result.skillScore.toFixed(0)}</span>
          </div>
          <div className="text-ink-500">
            Will <span className="ml-1 font-display text-xl font-bold text-purple-400">{result.willScore.toFixed(0)}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.25 }}
          className="mt-5 flex justify-center"
        >
          <ArchetypeBadge archetype={result.archetype} size="lg" />
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          onClick={onDone}
          className="btn-primary mt-8 px-8 py-3"
        >
          ดูแผนพัฒนา <ArrowRight size={15} />
        </motion.button>
      </motion.div>
    </div>
  )
}
