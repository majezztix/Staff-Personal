import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { api, type Admin } from '../api/client'
import { useAuth } from '../store/auth'
import PageHeader from '../components/layout/PageHeader'

export default function Admins() {
  const { id: myId, role } = useAuth()
  const isSuper = role === 'SUPERADMIN'
  const qc = useQueryClient()

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => (await api.get<Admin[]>('/admins')).data,
    enabled: isSuper,
  })

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [adminRole, setAdminRole] = useState<'ADMIN' | 'SUPERADMIN'>('ADMIN')
  const [error, setError] = useState<string | null>(null)

  const addMut = useMutation({
    mutationFn: async () => api.post('/admins', { username, password, role: adminRole }),
    onSuccess: () => {
      setUsername('')
      setPassword('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['admins'] })
    },
    onError: (e: any) => setError(e?.response?.data?.error || 'Failed'),
  })

  const reset2faMut = useMutation({
    mutationFn: async (id: string) => api.patch(`/admins/${id}`, { resetTotp: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/admins/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })

  if (!isSuper) {
    return (
      <div className="panel p-12 text-center text-ink-400">
        ต้องเป็น Superadmin จึงจะจัดการ admin ได้
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Admins" subtitle="จัดการบัญชีผู้ใช้ที่เข้าใช้งานระบบ" />

      <div className="panel p-6 mb-6">
        <h2 className="font-display text-lg font-bold mb-4 text-ink-50">เพิ่ม Admin ใหม่</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addMut.mutate()
          }}
          className="grid gap-3 md:grid-cols-[1fr,1fr,180px,auto]"
        >
          <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input
            className="input"
            type="password"
            placeholder="Password (อย่างน้อย 8 ตัว)"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select className="input" value={adminRole} onChange={(e) => setAdminRole(e.target.value as any)}>
            <option value="ADMIN">Admin</option>
            <option value="SUPERADMIN">Super Admin</option>
          </select>
          <button className="btn-primary" disabled={addMut.isPending}>
            {addMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} เพิ่ม
          </button>
        </form>
        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <p className="mt-3 text-xs text-ink-500">Admin ใหม่จะถูกบังคับให้ตั้งค่า 2FA ในการ login ครั้งแรก</p>
      </div>

      <div className="panel divide-y divide-white/5">
        {isLoading ? (
          <div className="p-6 text-ink-400">Loading...</div>
        ) : (
          admins.map((a) => (
            <div key={a.id} className="flex items-center gap-4 p-4">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-amber-500 via-purple-500 to-blue-500 font-display font-bold text-ink-950">
                {a.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-ink-100">
                  {a.username}
                  {a.id === myId && <span className="ml-2 text-xs text-amber-300">(คุณ)</span>}
                </div>
                <div className="text-xs text-ink-500">
                  สมาชิกตั้งแต่ {new Date(a.createdAt).toISOString().slice(0, 10)}
                </div>
              </div>
              <span
                className={`badge ${
                  a.role === 'SUPERADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-ink-300'
                }`}
              >
                {a.role}
              </span>
              <span className={`badge ${a.totpEnabled ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {a.totpEnabled ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                2FA
              </span>
              {a.id !== myId && (
                <>
                  <button
                    onClick={() => reset2faMut.mutate(a.id)}
                    className="btn-ghost text-xs"
                    title="Reset 2FA — บังคับให้ตั้งค่า 2FA ใหม่"
                  >
                    <KeyRound size={14} /> Reset 2FA
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`ลบ admin "${a.username}"?`)) deleteMut.mutate(a.id)
                    }}
                    className="text-ink-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
