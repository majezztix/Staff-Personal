import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '../store/auth'

export default function Login() {
  const { login, authenticated, pending, needs2FASetup, needs2FAVerify } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('Admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authenticated) navigate('/', { replace: true })
    else if (pending && needs2FASetup) navigate('/setup-2fa', { replace: true })
    else if (pending && needs2FAVerify) navigate('/verify-2fa', { replace: true })
  }, [authenticated, pending, needs2FASetup, needs2FAVerify, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await login(username, password)
      if (r.authenticated) navigate('/', { replace: true })
      else if (r.needs2FASetup) navigate('/setup-2fa')
      else navigate('/verify-2fa')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md panel p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500 via-purple-500 to-blue-500 font-display text-xl font-bold text-ink-950">
            T
          </div>
          <div>
            <div className="font-display text-2xl font-bold tracking-wide text-amber-300">TAS Cards</div>
            <div className="text-sm text-ink-400">Archetype Console · ระบบภายใน</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">ชื่อผู้ใช้</label>
            <input
              className="input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-ink-400">
          ระบบใช้ 2-Factor Authentication ผ่าน Google Authenticator — login ครั้งแรกจะให้ scan QR code
        </div>
      </motion.div>
    </div>
  )
}
