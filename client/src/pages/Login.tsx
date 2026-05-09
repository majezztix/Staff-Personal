import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Loader2, Zap } from 'lucide-react'
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
      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-amber-500/8 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
        className="w-full max-w-[400px]"
      >
        {/* card */}
        <div className="panel p-8">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3.5">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-fuchsia-500 to-blue-500 shadow-[0_0_28px_-6px_rgba(245,158,11,0.55)]">
              <Zap size={20} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-white">TAS Cards</div>
              <div className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">
                Archetype Console · ระบบภายใน
              </div>
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
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              เข้าสู่ระบบ
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 text-xs text-ink-600 leading-relaxed">
            ระบบใช้ 2-Factor Authentication ผ่าน Google Authenticator — login ครั้งแรกจะให้ scan QR code
          </div>
        </div>
      </motion.div>
    </div>
  )
}
