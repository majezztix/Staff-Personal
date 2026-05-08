import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { generateSecret, toQrDataUrl, verifyToken } from '../services/totp.service.js'

const router = Router()

const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
})

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' })

  const { username, password } = parsed.data
  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' })

  const ok = await bcrypt.compare(password, admin.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })

  // 2FA bypass — skip the TOTP stage and authenticate immediately
  if (env.DISABLE_2FA) {
    req.session.adminId = admin.id
    req.session.role = admin.role
    req.session.twoFAVerified = true
    req.session.pendingAdminId = undefined
    return res.json({
      authenticated: true,
      id: admin.id,
      username: admin.username,
      role: admin.role,
    })
  }

  // Stage 1: password OK; mark pending until 2FA verified
  req.session.pendingAdminId = admin.id
  req.session.adminId = undefined
  req.session.twoFAVerified = false

  return res.json({
    needs2FASetup: !admin.totpEnabled,
    needs2FAVerify: admin.totpEnabled,
  })
})

router.post('/2fa/setup', async (req, res) => {
  const adminId = req.session.pendingAdminId || req.session.adminId
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' })

  const admin = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!admin) return res.status(404).json({ error: 'Admin not found' })
  if (admin.totpEnabled) return res.status(400).json({ error: '2FA already enabled' })

  const { base32, otpauthUrl } = generateSecret(admin.username)
  const qrDataUrl = await toQrDataUrl(otpauthUrl)

  // Store secret tentatively (not yet enabled)
  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpSecret: base32 },
  })

  return res.json({ qrDataUrl, secret: base32 })
})

const VerifySchema = z.object({ token: z.string().regex(/^\d{6}$/) })

router.post('/2fa/verify', async (req, res) => {
  const adminId = req.session.pendingAdminId || req.session.adminId
  if (!adminId) return res.status(401).json({ error: 'Not authenticated' })

  const parsed = VerifySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid token' })

  const admin = await prisma.admin.findUnique({ where: { id: adminId } })
  if (!admin || !admin.totpSecret) return res.status(400).json({ error: '2FA not initialized' })

  const ok = verifyToken(admin.totpSecret, parsed.data.token)
  if (!ok) return res.status(401).json({ error: 'Invalid 2FA code' })

  if (!admin.totpEnabled) {
    await prisma.admin.update({
      where: { id: admin.id },
      data: { totpEnabled: true },
    })
  }

  req.session.adminId = admin.id
  req.session.role = admin.role
  req.session.twoFAVerified = true
  req.session.pendingAdminId = undefined

  return res.json({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  })
})

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('tas.sid')
    res.json({ ok: true })
  })
})

router.get('/me', async (req, res) => {
  // 2FA bypass: auto-complete any leftover pending session from before the flag was flipped
  if (env.DISABLE_2FA && req.session.pendingAdminId && !req.session.adminId) {
    const a = await prisma.admin.findUnique({ where: { id: req.session.pendingAdminId } })
    if (a) {
      req.session.adminId = a.id
      req.session.role = a.role
      req.session.twoFAVerified = true
      req.session.pendingAdminId = undefined
    } else {
      req.session.pendingAdminId = undefined
    }
  }

  if (!req.session.adminId || !req.session.twoFAVerified) {
    if (req.session.pendingAdminId) {
      const a = await prisma.admin.findUnique({ where: { id: req.session.pendingAdminId } })
      return res.json({
        pending: true,
        needs2FASetup: a ? !a.totpEnabled : false,
        needs2FAVerify: a ? a.totpEnabled : false,
        username: a?.username,
      })
    }
    return res.json({ authenticated: false })
  }
  const admin = await prisma.admin.findUnique({
    where: { id: req.session.adminId },
    select: { id: true, username: true, role: true, totpEnabled: true },
  })
  return res.json({ authenticated: true, ...admin })
})

export default router
