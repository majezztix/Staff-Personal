import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../store/auth'

export default function Setup2FA() {
  const { setup2FA, verify2FA, pending, authenticated } = useAuth()
  const navigate = useNavigate()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (authenticated) navigate('/', { replace: true })
    else if (!pending) navigate('/login', { replace: true })
  }, [authenticated, pending, navigate])

  useEffect(() => {
    let cancel = false
    setup2FA()
      .then((r) => {
        if (cancel) return
        setQrDataUrl(r.qrDataUrl)
        setSecret(r.secret)
      })
      .catch((e) => setError(e?.response?.data?.error || 'Setup failed'))
    return () => {
      cancel = true
    }
  }, [setup2FA])

  async function onVerify(e: React.FormEvent) {
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
        className="w-full max-w-lg panel p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="text-amber-400" size={28} />
          <div>
            <div className="font-display text-2xl font-bold text-ink-50">เปิดใช้งาน 2FA</div>
            <div className="text-sm text-ink-400">Scan QR code ด้วย Google Authenticator</div>
          </div>
        </div>

        <div className="mb-6 grid place-items-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="2FA QR" className="rounded-lg border border-white/10 bg-white p-2" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-white/5">
              <Loader2 className="animate-spin text-ink-500" />
            </div>
          )}
        </div>

        {secret && (
          <div className="mb-6 rounded-lg border border-white/5 bg-white/5 p-3 text-center text-xs text-ink-400">
            หรือกรอก secret ด้วยมือ:
            <div className="mt-1 select-all font-mono text-sm text-ink-100">{secret}</div>
          </div>
        )}

        <form onSubmit={onVerify} className="space-y-4">
          <div>
            <label className="label">ใส่รหัส 6 หลักจาก Authenticator</label>
            <input
              className="input text-center font-mono text-lg tracking-[0.5em]"
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
            ยืนยันและเข้าสู่ระบบ
          </button>
        </form>
      </motion.div>
    </div>
  )
}
