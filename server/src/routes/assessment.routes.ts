import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { score } from '../services/scoring.service.js'

const router = Router()
router.use(requireAuth)

const Schema = z.object({
  employeeId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.number().int().min(1).max(5),
      })
    )
    .min(1),
  notes: z.string().max(2000).optional(),
})

router.post('/', async (req, res) => {
  const parsed = Schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const { employeeId, answers, notes } = parsed.data

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) return res.status(404).json({ error: 'Employee not found' })

  const ids = answers.map((a) => a.questionId)
  const questions = await prisma.question.findMany({ where: { id: { in: ids } } })
  if (questions.length === 0) return res.status(400).json({ error: 'No valid questions' })

  const result = score(questions, answers)

  const assessment = await prisma.assessment.create({
    data: {
      employeeId,
      takenById: req.session.adminId!,
      skillScore: result.skillScore,
      willScore: result.willScore,
      archetype: result.archetype,
      rawAnswers: answers,
      notes,
    },
  })

  res.status(201).json(assessment)
})

router.get('/:id', async (req, res) => {
  const a = await prisma.assessment.findUnique({
    where: { id: req.params.id },
    include: {
      employee: true,
      takenBy: { select: { id: true, username: true } },
    },
  })
  if (!a) return res.status(404).json({ error: 'Not found' })
  res.json(a)
})

export default router
