import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { generateDevPlan } from '../services/ai.service.js'

const router = Router()
router.use(requireAuth)

const Schema = z.object({
  assessmentId: z.string().min(1),
  regenerate: z.boolean().optional(),
})

router.post('/dev-plan', async (req, res) => {
  const parsed = Schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message })
  const { assessmentId, regenerate } = parsed.data

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { employee: true },
  })
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' })

  if (assessment.aiPlan && !regenerate) {
    return res.json({ plan: assessment.aiPlan, cached: true })
  }

  const history = await prisma.assessment.findMany({
    where: { employeeId: assessment.employeeId, id: { not: assessment.id } },
    orderBy: { takenAt: 'desc' },
    select: { archetype: true, takenAt: true },
    take: 5,
  })

  try {
    const plan = await generateDevPlan({
      employee: assessment.employee,
      assessment,
      history,
    })
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { aiPlan: plan },
    })
    res.json({ plan, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'AI error'
    res.status(503).json({ error: msg })
  }
})

export default router
