import { Router } from 'express'
import { z } from 'zod'
import path from 'node:path'
import fs from 'node:fs'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { photoUpload } from '../middleware/upload.js'
import { env } from '../lib/env.js'

const router = Router()
router.use(requireAuth)

const CreateSchema = z.object({
  fullName: z.string().min(1).max(128),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  position: z.string().min(1).max(128),
  department: z.string().min(1).max(128),
  startDate: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  notes: z.string().max(2000).optional(),
})

router.get('/', async (req, res) => {
  const { dept, archetype, search } = req.query as Record<string, string | undefined>
  const employees = await prisma.employee.findMany({
    where: {
      archivedAt: null,
      department: dept || undefined,
      OR: search
        ? [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: {
      assessments: {
        orderBy: { takenAt: 'desc' },
        take: 1,
        select: { id: true, archetype: true, skillScore: true, willScore: true, takenAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  const filtered = archetype
    ? employees.filter((e) => e.assessments[0]?.archetype === archetype)
    : employees
  res.json(
    filtered.map((e) => ({
      ...e,
      latest: e.assessments[0] || null,
      assessments: undefined,
    }))
  )
})

router.get('/:id', async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      assessments: {
        orderBy: { takenAt: 'desc' },
        select: {
          id: true,
          takenAt: true,
          archetype: true,
          skillScore: true,
          willScore: true,
          aiPlan: true,
          notes: true,
          takenBy: { select: { id: true, username: true } },
        },
      },
    },
  })
  if (!employee) return res.status(404).json({ error: 'Not found' })
  res.json({ ...employee, latest: employee.assessments[0] || null })
})

router.post('/', photoUpload.single('photo'), async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body)
  if (!parsed.success) {
    if (req.file) fs.unlinkSync(path.resolve(env.UPLOAD_DIR, req.file.filename))
    return res.status(400).json({ error: parsed.error.message })
  }
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null
  const employee = await prisma.employee.create({
    data: {
      ...parsed.data,
      photoPath,
    },
  })
  res.status(201).json(employee)
})

router.patch('/:id', photoUpload.single('photo'), async (req, res) => {
  const parsed = CreateSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })

  const data: Record<string, unknown> = { ...parsed.data }
  if (req.file) {
    const old = await prisma.employee.findUnique({ where: { id: req.params.id }, select: { photoPath: true } })
    if (old?.photoPath) {
      const oldFile = path.resolve(env.UPLOAD_DIR, path.basename(old.photoPath))
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
    }
    data.photoPath = `/uploads/${req.file.filename}`
  }

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data,
  })
  res.json(employee)
})

router.delete('/:id', async (req, res) => {
  await prisma.employee.update({
    where: { id: req.params.id },
    data: { archivedAt: new Date() },
  })
  res.json({ ok: true })
})

router.get('/:id/assessments', async (req, res) => {
  const list = await prisma.assessment.findMany({
    where: { employeeId: req.params.id },
    orderBy: { takenAt: 'desc' },
    select: {
      id: true,
      takenAt: true,
      archetype: true,
      skillScore: true,
      willScore: true,
      takenBy: { select: { id: true, username: true } },
    },
  })
  res.json(list)
})

export default router
