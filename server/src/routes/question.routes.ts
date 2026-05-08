import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requireSuperadmin } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const includeInactive = req.query.all === '1'
  const list = await prisma.question.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: { order: 'asc' },
  })
  res.json(list)
})

const Schema = z.object({
  text: z.string().min(1).max(500),
  axis: z.enum(['SKILL', 'WILL']),
  reversed: z.boolean().default(false),
  weight: z.number().positive().max(10).default(1),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().default(true),
})

router.post('/', requireSuperadmin, async (req, res) => {
  const parsed = Schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const max = await prisma.question.aggregate({ _max: { order: true } })
  const order = parsed.data.order ?? (max._max.order ?? 0) + 1
  const q = await prisma.question.create({ data: { ...parsed.data, order } })
  res.status(201).json(q)
})

router.patch('/:id', requireSuperadmin, async (req, res) => {
  const parsed = Schema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const q = await prisma.question.update({
    where: { id: req.params.id },
    data: parsed.data,
  })
  res.json(q)
})

router.delete('/:id', requireSuperadmin, async (req, res) => {
  await prisma.question.update({
    where: { id: req.params.id },
    data: { active: false },
  })
  res.json({ ok: true })
})

export default router
