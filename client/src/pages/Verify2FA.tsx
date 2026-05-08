import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../store/auth'

export default function Verify2FA() {
  const { verify2FA, authenticated, pending, username } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authenticated) navigate('/', { replace: true })
    else if (!pending) navigate('/login', { replace: true })
  }, [authenticated, pending, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await verify2FA(code)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid code')
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
          <ShieldCheck className="text-amber-400" size={28} />
          <div>
            <div className="font-display text-2xl font-bold text-ink-50">ยืนยันตัวตน 2FA</div>
            <div className="text-sm text-ink-400">{username ? `สวัสดี ${username}` : 'กรอกรหัสจาก Authenticator'}</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">รหัส 6 หลัก</label>
            <input
              autoFocus
              className="input text-center font-mono text-2xl tracking-[0.5em]"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            ยืนยัน
          </button>
        </form>
      </motion.div>
    </div>
  )
}
