import { Router } from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const CreateSchema = z.object({
  employeeId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(90).default(14),
})

// POST /api/assessment-tokens — admin generates a single-use link for an employee
router.post('/', async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })

  const { employeeId, expiresInDays } = parsed.data
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) return res.status(404).json({ error: 'Employee not found' })

  const token = crypto.randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  const created = await prisma.assessmentToken.create({
    data: {
      token,
      employeeId,
      createdById: req.session.adminId!,
      expiresAt,
    },
  })

  res.status(201).json(created)
})

// GET /api/assessment-tokens — list (optional filter by employee)
router.get('/', async (req, res) => {
  const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : undefined
  const tokens = await prisma.assessmentToken.findMany({
    where: employeeId ? { employeeId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      employee: { select: { id: true, fullName: true, email: true, department: true, position: true } },
    },
  })
  res.json(tokens)
})

// DELETE /api/assessment-tokens/:id — revoke
router.delete('/:id', async (req, res) => {
  const t = await prisma.assessmentToken.update({
    where: { id: req.params.id },
    data: { revoked: true },
  }).catch(() => null)
  if (!t) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

export default router
