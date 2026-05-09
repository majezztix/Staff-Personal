import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import {
  buildEmployeePdf,
  buildRosterPdf,
  buildDashboardPdf,
  toCsv,
  toXlsx,
  type EmployeeRow,
} from '../services/export.service.js'
import type { Archetype } from '@prisma/client'

const router = Router()
router.use(requireAuth)

async function buildRows(): Promise<EmployeeRow[]> {
  const employees = await prisma.employee.findMany({
    where: { archivedAt: null },
    include: {
      assessments: { orderBy: { takenAt: 'desc' }, take: 1 },
    },
    orderBy: { fullName: 'asc' },
  })
  return employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    email: e.email,
    position: e.position,
    department: e.department,
    archetype: e.assessments[0]?.archetype ?? null,
    skillScore: e.assessments[0]?.skillScore ?? null,
    willScore: e.assessments[0]?.willScore ?? null,
    lastAssessedAt: e.assessments[0]?.takenAt ?? null,
  }))
}

router.get('/employees.csv', async (_req, res) => {
  const rows = await buildRows()
  const csv = toCsv(rows)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="employees-${Date.now()}.csv"`)
  res.send('﻿' + csv) // BOM for Excel UTF-8
})

router.get('/employees.xlsx', async (_req, res) => {
  const rows = await buildRows()
  const buf = await toXlsx(rows)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="employees-${Date.now()}.xlsx"`)
  res.send(buf)
})

router.get('/employee/:id.pdf', async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    include: {
      assessments: { orderBy: { takenAt: 'desc' }, take: 1 },
    },
  })
  if (!employee) return res.status(404).json({ error: 'Not found' })
  const latest = employee.assessments[0] ?? null
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="employee-${employee.id}.pdf"`)
  const stream = buildEmployeePdf({ employee, latest, aiPlan: latest?.aiPlan })
  stream.pipe(res)
})

// Roster table PDF
router.get('/roster.pdf', async (_req, res) => {
  const rows = await buildRows()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="roster-${Date.now()}.pdf"`)
  buildRosterPdf(rows).pipe(res)
})

// Dashboard PDF — overview + by-department + top performers
router.get('/dashboard.pdf', async (_req, res) => {
  const employees = await prisma.employee.findMany({
    where: { archivedAt: null },
    select: {
      department: true,
      assessments: {
        orderBy: { takenAt: 'desc' },
        take: 1,
        select: { archetype: true, skillScore: true, willScore: true },
      },
    },
  })
  const counts: Record<Archetype, number> = { DELEGATE: 0, COACH: 0, INSPIRE_SUPPORT: 0, TELL: 0 }
  let assessed = 0
  for (const e of employees) {
    if (e.assessments[0]) {
      counts[e.assessments[0].archetype]++
      assessed++
    }
  }

  // by department aggregation
  const byDeptMap = new Map<string, {
    department: string; total: number; assessed: number;
    avgSkill: number; avgWill: number; counts: Record<Archetype, number>
  }>()
  for (const e of employees) {
    const d = e.department || '—'
    if (!byDeptMap.has(d)) {
      byDeptMap.set(d, {
        department: d, total: 0, assessed: 0, avgSkill: 0, avgWill: 0,
        counts: { DELEGATE: 0, COACH: 0, INSPIRE_SUPPORT: 0, TELL: 0 },
      })
    }
    const dept = byDeptMap.get(d)!
    dept.total++
    if (e.assessments[0]) {
      dept.assessed++
      dept.avgSkill += e.assessments[0].skillScore
      dept.avgWill += e.assessments[0].willScore
      dept.counts[e.assessments[0].archetype]++
    }
  }
  const byDept = Array.from(byDeptMap.values()).map((d) => ({
    ...d,
    avgSkill: d.assessed ? Math.round(d.avgSkill / d.assessed) : 0,
    avgWill: d.assessed ? Math.round(d.avgWill / d.assessed) : 0,
  })).sort((a, b) => b.total - a.total)

  // Top performers
  const topRaw = await prisma.employee.findMany({
    where: { archivedAt: null },
    select: {
      fullName: true,
      department: true,
      position: true,
      assessments: {
        orderBy: { takenAt: 'desc' },
        take: 1,
        select: { archetype: true, skillScore: true, willScore: true },
      },
    },
  })
  const topPerformers = topRaw
    .filter((e) => e.assessments[0])
    .map((e) => ({
      fullName: e.fullName,
      department: e.department,
      position: e.position,
      archetype: e.assessments[0].archetype,
      skillScore: e.assessments[0].skillScore,
      willScore: e.assessments[0].willScore,
    }))
    .sort((a, b) => b.skillScore + b.willScore - (a.skillScore + a.willScore))
    .slice(0, 5)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="dashboard-${Date.now()}.pdf"`)
  buildDashboardPdf({
    overview: { total: employees.length, assessed, unassessed: employees.length - assessed, counts },
    byDept,
    topPerformers,
  }).pipe(res)
})

export default router
