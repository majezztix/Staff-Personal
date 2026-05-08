import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireSuperadmin } from '../middleware/auth.js'

const router = Router()

router.use(requireSuperadmin)

router.get('/', async (_req, res) => {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      totpEnabled: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
  res.json(admins)
})

const CreateSchema = z.object({
  username: z.string().min(2).max(64),
  password: z.string().min(8).max(256),
  role: z.enum(['SUPERADMIN', 'ADMIN']).default('ADMIN'),
})

router.post('/', async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const { username, password, role } = parsed.data
  const dup = await prisma.admin.findUnique({ where: { username } })
  if (dup) return res.status(409).json({ error: 'Username already exists' })

  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await prisma.admin.create({
    data: {
      username,
      passwordHash,
      role,
      createdById: req.session.adminId,
    },
    select: { id: true, username: true, role: true, totpEnabled: true, createdAt: true },
  })
  res.status(201).json(admin)
})

const UpdateSchema = z.object({
  password: z.string().min(8).max(256).optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN']).optional(),
  resetTotp: z.boolean().optional(),
})

router.patch('/:id', async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const { password, role, resetTotp } = parsed.data

  const data: Record<string, unknown> = {}
  if (password) data.passwordHash = await bcrypt.hash(password, 12)
  if (role) data.role = role
  if (resetTotp) {
    data.totpEnabled = false
    data.totpSecret = null
  }

  const admin = await prisma.admin.update({
    where: { id: req.params.id },
    data,
    select: { id: true, username: true, role: true, totpEnabled: true },
  })
  res.json(admin)
})

router.delete('/:id', async (req, res) => {
  if (req.params.id === req.session.adminId) {
    return res.status(400).json({ error: 'Cannot delete yourself' })
  }
  await prisma.admin.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

export default router
