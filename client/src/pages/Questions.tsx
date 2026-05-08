import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
      <div className="panel p-12 text-center text-ink-400">
        ต้องเป็น Superadmin จึงจะแก้ไขคำถามได้
      </div>
    )
  }

  const skillCount = questions.filter((q) => q.axis === 'SKILL' && q.active).length
  const willCount = questions.filter((q) => q.axis === 'WILL' && q.active).length

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle={`Skill ${skillCount} ข้อ · Will ${willCount} ข้อ · รวม ${questions.length}`}
      />

      <div className="panel p-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-4 text-ink-50">เพิ่มคำถาม</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) addMut.mutate()
          }}
          className="space-y-3"
        >
          <textarea
            className="input min-h-[80px]"
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
            <label className="flex items-center gap-2 text-sm text-ink-300">
              <input type="checkbox" checked={reversed} onChange={(e) => setReversed(e.target.checked)} />
              Reverse-scored
            </label>
            <button type="submit" className="btn-primary ml-auto" disabled={addMut.isPending}>
              {addMut.isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} เพิ่ม
            </button>
          </div>
        </form>
      </div>

      <div className="panel divide-y divide-white/5">
        {isLoading ? (
          <div className="p-6 text-ink-400">Loading...</div>
        ) : (
          questions.map((q) => (
            <div key={q.id} className={`flex items-start gap-3 p-4 ${!q.active ? 'opacity-40' : ''}`}>
              <span
                className="mt-0.5 inline-flex w-14 shrink-0 justify-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  backgroundColor: q.axis === 'SKILL' ? '#3B82F633' : '#A855F733',
                  color: q.axis === 'SKILL' ? '#60A5FA' : '#C084FC',
                }}
              >
                {q.axis}
              </span>
              <div className="flex-1">
                <div className="text-sm text-ink-100">{q.text}</div>
                {q.reversed && (
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-amber-400">REVERSE</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleMut.mutate(q)}
                className="text-xs text-ink-400 hover:text-ink-100"
              >
                {q.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
              </button>
              <button
                type="button"
                onClick={() => deleteMut.mutate(q.id)}
                className="text-ink-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
