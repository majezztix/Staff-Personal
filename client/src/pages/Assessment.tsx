import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { api, type Question, type Employee, type Assessment } from '../api/client'
import { ARCHETYPES } from '../lib/archetypes'
import ArchetypeBadge from '../components/cards/ArchetypeBadge'

const LIKERT = [
  { value: 1, label: 'ไม่จริงเลย', color: '#EF4444' },
  { value: 2, label: 'ค่อนข้างไม่จริง', color: '#F97316' },
  { value: 3, label: 'กลาง ๆ', color: '#FCD34D' },
  { value: 4, label: 'ค่อนข้างจริง', color: '#84CC16' },
  { value: 5, label: 'จริงมาก', color: '#22C55E' },
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
    }, 280)
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

  if (isLoading || !current) return <div className="text-ink-400">Loading…</div>

  if (result) return <ResultReveal result={result} employeeName={employee?.fullName || ''} onDone={() => navigate(`/employees/${id}`)} />

  const progress = ((step + 1) / total) * 100
  const axisColor = current.axis === 'SKILL' ? '#3B82F6' : '#A855F7'

  return (
    <div className="min-h-[80vh]">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(`/employees/${id}`)} className="btn-ghost">
          <ArrowLeft size={16} /> ออก
        </button>
        <div className="text-sm text-ink-400">
          {employee?.fullName} · ข้อ <span className="font-bold text-ink-100">{step + 1}</span> / {total}
        </div>
        <div className="w-20" />
      </div>

      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-ink-900/80">
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #F59E0B, #A855F7, #3B82F6)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid place-items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 60, rotateY: 25 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -60, rotateY: -25 }}
            transition={{ duration: 0.3 }}
            style={{ perspective: 1200 }}
            className="w-full max-w-xl"
          >
            <div
              className="relative overflow-hidden rounded-2xl p-8 ring-1 ring-white/10"
              style={{
                background: `linear-gradient(155deg, ${axisColor}22 0%, rgba(2,6,23,0.95) 50%, rgba(2,6,23,1) 100%)`,
                boxShadow: `0 30px 70px -25px ${axisColor}66`,
              }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: `${axisColor}33`, color: axisColor }}>
                {current.axis === 'SKILL' ? '⚡ Skill Axis' : '🔥 Will Axis'}
              </div>
              <p className="font-display text-2xl font-bold leading-relaxed text-ink-50">{current.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 grid grid-cols-5 gap-3 w-full max-w-2xl">
          {LIKERT.map((l) => {
            const selected = answers[current.id] === l.value
            return (
              <motion.button
                key={l.value}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick(l.value)}
                className="relative overflow-hidden rounded-xl p-4 text-center ring-1 transition"
                style={{
                  backgroundColor: selected ? `${l.color}33` : 'rgba(2,6,23,0.6)',
                  boxShadow: selected ? `0 0 0 2px ${l.color}` : `inset 0 0 0 1px rgba(255,255,255,0.08)`,
                }}
              >
                <div className="text-2xl font-bold" style={{ color: l.color }}>
                  {l.value}
                </div>
                <div className="mt-1 text-[11px] text-ink-300">{l.label}</div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-ink-500">
          <span>⌨ กดเลข 1-5 เพื่อเลือก</span>
          {step > 0 && (
            <button onClick={back} className="btn-ghost text-xs">
              <ArrowLeft size={12} /> ย้อนกลับ
            </button>
          )}
        </div>

        {submitMut.isPending && (
          <div className="mt-8 flex items-center gap-2 text-amber-300">
            <Loader2 className="animate-spin" size={16} /> กำลังคำนวณผล...
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
    <div className="grid min-h-[70vh] place-items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="text-center"
      >
        <div className="mb-2 text-sm uppercase tracking-[0.3em] text-ink-500">Result</div>
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mx-auto mb-6 flex h-44 w-44 items-center justify-center rounded-full ring-4"
          style={{
            background: `radial-gradient(circle, ${t.primary}55, transparent 70%)`,
            boxShadow: `0 0 80px ${t.primary}55`,
            borderColor: t.primary,
          }}
        >
          <Sparkles size={56} style={{ color: t.primary }} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="font-display text-6xl font-bold tracking-tight"
          style={{ color: t.primary, textShadow: `0 0 30px ${t.primary}88` }}
        >
          {t.label}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mt-3 text-lg text-ink-200"
        >
          {employeeName} · <span className="text-ink-400">{t.tagline}</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 max-w-md text-sm text-ink-400 mx-auto"
        >
          {t.description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.15 }}
          className="mt-6 flex justify-center gap-6 text-sm text-ink-400"
        >
          <div>
            Skill <span className="text-ink-50 font-bold">{result.skillScore.toFixed(0)}</span>
          </div>
          <div>
            Will <span className="text-ink-50 font-bold">{result.willScore.toFixed(0)}</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 flex justify-center gap-2"
        >
          <ArchetypeBadge archetype={result.archetype} size="lg" />
        </motion.div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          onClick={onDone}
          className="btn-primary mt-8"
        >
          ดูแผนพัฒนา <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  )
}
