import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { score } from '../services/scoring.service.js'

const router = Router()

// Helper — fetch & validate token
async function loadActiveToken(tokenStr: string) {
  const t = await prisma.assessmentToken.findUnique({
    where: { token: tokenStr },
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          position: true,
          department: true,
          photoPath: true,
          archivedAt: true,
        },
      },
    },
  })
  if (!t) return { error: 'TOKEN_NOT_FOUND' as const }
  if (t.revoked) return { error: 'TOKEN_REVOKED' as const }
  if (t.usedAt) return { error: 'TOKEN_ALREADY_USED' as const }
  if (t.expiresAt < new Date()) return { error: 'TOKEN_EXPIRED' as const }
  if (t.employee.archivedAt) return { error: 'EMPLOYEE_ARCHIVED' as const }
  return { token: t }
}

// GET /api/public/take/:token — fetch employee summary + active questions
router.get('/take/:token', async (req, res) => {
  const result = await loadActiveToken(req.params.token)
  if ('error' in result) return res.status(410).json({ error: result.error })

  const questions = await prisma.question.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    select: { id: true, text: true, axis: true, order: true },
  })

  res.json({
    employee: {
      id: result.token.employee.id,
      fullName: result.token.employee.fullName,
      position: result.token.employee.position,
      department: result.token.employee.department,
      photoPath: result.token.employee.photoPath,
    },
    expiresAt: result.token.expiresAt,
    questions,
  })
})

// POST /api/public/take/:token — submit answers, mark token as used
const SubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.number().int().min(1).max(5),
      })
    )
    .min(1),
})

router.post('/take/:token', async (req, res) => {
  const result = await loadActiveToken(req.params.token)
  if ('error' in result) return res.status(410).json({ error: result.error })

  const parsed = SubmitSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_PAYLOAD' })

  const { answers } = parsed.data
  const ids = answers.map((a) => a.questionId)
  const questions = await prisma.question.findMany({ where: { id: { in: ids } } })
  if (questions.length === 0) return res.status(400).json({ error: 'NO_VALID_QUESTIONS' })

  const scoreResult = score(questions, answers)

  // Atomic: create assessment + mark token used
  const [assessment] = await prisma.$transaction([
    prisma.assessment.create({
      data: {
        employeeId: result.token.employeeId,
        takenById: null,
        source: 'SELF',
        tokenId: result.token.id,
        skillScore: scoreResult.skillScore,
        willScore: scoreResult.willScore,
        archetype: scoreResult.archetype,
        rawAnswers: answers,
      },
      select: { id: true, archetype: true, skillScore: true, willScore: true },
    }),
    prisma.assessmentToken.update({
      where: { id: result.token.id },
      data: { usedAt: new Date() },
    }),
  ])

  res.status(201).json({
    ok: true,
    archetype: assessment.archetype,
    skillScore: assessment.skillScore,
    willScore: assessment.willScore,
  })
})

export default router
