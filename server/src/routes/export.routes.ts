import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { buildEmployeePdf, toCsv, toXlsx, type EmployeeRow } from '../services/export.service.js'

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

export default router
