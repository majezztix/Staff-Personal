import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, RotateCcw } from 'lucide-react'
import { api, type Question } from '../api/client'
import { useAuth } from '../store/auth'
import PageHeader from '../components/layout/PageHeader'

export default function Questions() {
  const { role } = useAuth()
  const isSuper = role === 'SUPERADMIN'
  const qc = useQueryClient()

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', 'all'],
    queryFn: async () => (await api.get<Question[]>('/questions?all=1')).data,
  })

  const [text, setText] = useState('')
  const [axis, setAxis] = useState<'SKILL' | 'WILL'>('SKILL')
  const [reversed, setReversed] = useState(false)

  const addMut = useMutation({
    mutationFn: async () => api.post('/questions', { text, axis, reversed, weight: 1 }),
    onSuccess: () => {
      setText('')
      setReversed(false)
      qc.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  const toggleMut = useMutation({
    mutationFn: async (q: Question) => api.patch(`/questions/${q.id}`, { active: !q.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['questions'] }),
  })

  if (!isSuper) {
    return (
      <div className="panel p-12 text-center text-sm text-ink-600">
        ต้องเป็น Superadmin จึงจะแก้ไขคำถามได้
      </div>
    )
  }

  const skillCount = questions.filter((q) => q.axis === 'SKILL' && q.active).length
  const willCount  = questions.filter((q) => q.axis === 'WILL'  && q.active).length

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle={`Skill ${skillCount} ข้อ · Will ${willCount} ข้อ · รวม ${questions.length}`}
      />

      {/* Add form */}
      <div className="panel p-6 mb-5">
        <h2 className="font-display text-base font-bold mb-4 text-white">เพิ่มคำถาม</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) addMut.mutate()
          }}
          className="space-y-3"
        >
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="ข้อความคำถาม..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <div className="flex items-center gap-3">
            <select className="input w-40" value={axis} onChange={(e) => setAxis(e.target.value as any)}>
              <option value="SKILL">Skill axis</option>
              <option value="WILL">Will axis</option>
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-400 select-none">
              <input
                type="checkbox"
                checked={reversed}
                onChange={(e) => setReversed(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-ink-900 accent-amber-400"
              />
              Reverse-scored
            </label>
            <button type="submit" className="btn-primary btn-sm ml-auto" disabled={addMut.isPending}>
              {addMut.isPending ? <Loader2 className="animate-spin" size={13} /> : <Plus size={13} />}
              เพิ่ม
            </button>
          </div>
        </form>
      </div>

      {/* Question list */}
      <div className="panel overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {questions.map((q) => (
              <div
                key={q.id}
                className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-white/[0.02] ${!q.active ? 'opacity-40' : ''}`}
              >
                <span
                  className={`mt-0.5 inline-flex w-14 shrink-0 justify-center rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    q.axis === 'SKILL'
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                  }`}
                >
                  {q.axis}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-200 leading-relaxed">{q.text}</div>
                  {q.reversed && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      <RotateCcw size={9} /> REVERSE
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleMut.mutate(q)}
                  className="shrink-0 text-xs text-ink-600 hover:text-ink-200 transition"
                >
                  {q.active ? 'ปิด' : 'เปิด'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteMut.mutate(q.id)}
                  className="shrink-0 text-ink-600 hover:text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
