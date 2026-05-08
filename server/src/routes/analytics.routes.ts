import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import type { Archetype } from '@prisma/client'

const router = Router()
router.use(requireAuth)

async function latestAssessmentsPerEmployee() {
  // For each non-archived employee, return the most recent assessment (if any)
  const employees = await prisma.employee.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      fullName: true,
      department: true,
      position: true,
      photoPath: true,
      assessments: {
        orderBy: { takenAt: 'desc' },
        take: 1,
        select: {
          id: true,
          archetype: true,
          skillScore: true,
          willScore: true,
          takenAt: true,
        },
      },
    },
  })
  return employees.map((e) => ({
    ...e,
    latest: e.assessments[0] || null,
    assessments: undefined,
  }))
}

router.get('/overview', async (_req, res) => {
  const employees = await latestAssessmentsPerEmployee()
  const counts: Record<Archetype, number> = {
    DELEGATE: 0,
    COACH: 0,
    INSPIRE_SUPPORT: 0,
    TELL: 0,
  }
  let assessed = 0
  for (const e of employees) {
    if (e.latest) {
      counts[e.latest.archetype]++
      assessed++
    }
  }
  res.json({
    total: employees.length,
    assessed,
    unassessed: employees.length - assessed,
    counts,
  })
})

router.get('/by-department', async (_req, res) => {
  const employees = await latestAssessmentsPerEmployee()
  const byDept: Record<string, Record<Archetype, number> & { total: number }> = {}
  for (const e of employees) {
    const d = e.department || '—'
    if (!byDept[d]) byDept[d] = { DELEGATE: 0, COACH: 0, INSPIRE_SUPPORT: 0, TELL: 0, total: 0 }
    byDept[d].total++
    if (e.latest) byDept[d][e.latest.archetype]++
  }
  res.json(byDept)
})

router.get('/quadrant', async (_req, res) => {
  const employees = await latestAssessmentsPerEmployee()
  const points = employees
    .filter((e) => e.latest)
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      department: e.department,
      position: e.position,
      photoPath: e.photoPath,
      x: e.latest!.skillScore,
      y: e.latest!.willScore,
      archetype: e.latest!.archetype,
    }))
  res.json(points)
})

export default router
