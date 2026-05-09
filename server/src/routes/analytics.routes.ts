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

// Recent assessments (last 8) — for dashboard activity feed
router.get('/recent', async (_req, res) => {
  const recent = await prisma.assessment.findMany({
    orderBy: { takenAt: 'desc' },
    take: 8,
    select: {
      id: true,
      takenAt: true,
      archetype: true,
      skillScore: true,
      willScore: true,
      source: true,
      employee: {
        select: { id: true, fullName: true, department: true, position: true, photoPath: true },
      },
      takenBy: { select: { username: true } },
    },
  })
  res.json(recent)
})

// Top performers — by combined skill+will score (latest assessment)
router.get('/top-performers', async (_req, res) => {
  const employees = await latestAssessmentsPerEmployee()
  const ranked = employees
    .filter((e) => e.latest)
    .map((e) => ({
      id: e.id,
      fullName: e.fullName,
      department: e.department,
      position: e.position,
      photoPath: e.photoPath,
      archetype: e.latest!.archetype,
      skillScore: e.latest!.skillScore,
      willScore: e.latest!.willScore,
      combined: e.latest!.skillScore + e.latest!.willScore,
    }))
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 5)
  res.json(ranked)
})

// Assessment timeline — counts grouped by week (last 12 weeks)
router.get('/timeline', async (_req, res) => {
  const since = new Date()
  since.setDate(since.getDate() - 84) // 12 weeks
  const assessments = await prisma.assessment.findMany({
    where: { takenAt: { gte: since } },
    select: { takenAt: true, archetype: true, source: true },
    orderBy: { takenAt: 'asc' },
  })

  // Bucket by ISO week
  const buckets: Record<string, { week: string; total: number; admin: number; self: number }> = {}
  for (const a of assessments) {
    const d = new Date(a.takenAt)
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const key = monday.toISOString().slice(0, 10)
    if (!buckets[key]) buckets[key] = { week: key, total: 0, admin: 0, self: 0 }
    buckets[key].total++
    if (a.source === 'SELF') buckets[key].self++
    else buckets[key].admin++
  }
  const sorted = Object.values(buckets).sort((a, b) => a.week.localeCompare(b.week))
  res.json(sorted)
})

// Department averages — avg skill, will, count, archetype mix
router.get('/department-stats', async (_req, res) => {
  const employees = await latestAssessmentsPerEmployee()
  const byDept: Record<string, {
    department: string
    total: number
    assessed: number
    avgSkill: number
    avgWill: number
    counts: Record<Archetype, number>
  }> = {}

  for (const e of employees) {
    const d = e.department || '—'
    if (!byDept[d]) {
      byDept[d] = {
        department: d,
        total: 0,
        assessed: 0,
        avgSkill: 0,
        avgWill: 0,
        counts: { DELEGATE: 0, COACH: 0, INSPIRE_SUPPORT: 0, TELL: 0 },
      }
    }
    byDept[d].total++
    if (e.latest) {
      byDept[d].assessed++
      byDept[d].avgSkill += e.latest.skillScore
      byDept[d].avgWill += e.latest.willScore
      byDept[d].counts[e.latest.archetype]++
    }
  }

  for (const d of Object.values(byDept)) {
    if (d.assessed > 0) {
      d.avgSkill = Math.round(d.avgSkill / d.assessed)
      d.avgWill = Math.round(d.avgWill / d.assessed)
    }
  }
  res.json(Object.values(byDept).sort((a, b) => b.total - a.total))
})

export default router
