import ExcelJS from 'exceljs'
import { Parser as Json2csvParser } from 'json2csv'
import PDFDocument from 'pdfkit'
import path from 'node:path'
import fs from 'node:fs'
import type { Archetype, Assessment, Employee } from '@prisma/client'
import { env } from '../lib/env.js'

export type EmployeeRow = {
  id: string
  fullName: string
  email: string | null
  position: string
  department: string
  archetype: Archetype | null
  skillScore: number | null
  willScore: number | null
  lastAssessedAt: Date | null
}

const HEADERS = [
  { key: 'id', label: 'ID' },
  { key: 'fullName', label: 'ชื่อ-นามสกุล' },
  { key: 'email', label: 'อีเมล' },
  { key: 'position', label: 'ตำแหน่ง' },
  { key: 'department', label: 'แผนก' },
  { key: 'archetype', label: 'Archetype' },
  { key: 'skillScore', label: 'Skill Score' },
  { key: 'willScore', label: 'Will Score' },
  { key: 'lastAssessedAt', label: 'ประเมินล่าสุด' },
] as const

export function toCsv(rows: EmployeeRow[]): string {
  const parser = new Json2csvParser({
    fields: HEADERS.map((h) => ({ label: h.label, value: h.key })),
  })
  return parser.parse(rows)
}

export async function toXlsx(rows: EmployeeRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'TAS Employee Cards'
  const ws = wb.addWorksheet('Employees')
  ws.columns = HEADERS.map((h) => ({ header: h.label, key: h.key, width: 20 }))
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  }
  rows.forEach((r) => ws.addRow(r))
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export const ARCHETYPE_COLORS: Record<Archetype, string> = {
  DELEGATE: '#F59E0B',
  COACH: '#3B82F6',
  INSPIRE_SUPPORT: '#A855F7',
  TELL: '#EF4444',
}

export const ARCHETYPE_LABEL: Record<Archetype, string> = {
  DELEGATE: 'DELEGATE',
  COACH: 'COACH',
  INSPIRE_SUPPORT: 'INSPIRE SUPPORT',
  TELL: 'TELL',
}

// ──────────────────────────────────────────────────────────
// Employee single PDF (existing — improved)
// ──────────────────────────────────────────────────────────
export function buildEmployeePdf(args: {
  employee: Employee
  latest: Assessment | null
  aiPlan?: string | null
}): NodeJS.ReadableStream {
  const { employee, latest, aiPlan } = args
  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  const archetype = latest?.archetype
  const accent = archetype ? ARCHETYPE_COLORS[archetype] : '#64748B'

  // Header band
  doc.rect(0, 0, doc.page.width, 100).fill(accent)
  doc.fillColor('#FFFFFF')
  doc.fontSize(28).text('Employee Archetype Card', 50, 32, { align: 'left' })
  doc.fontSize(11).text(`TAS Consulting · ${new Date().toISOString().slice(0, 10)}`, 50, 70)
  doc.fillColor('#000000')

  // Photo
  let cursorY = 130
  if (employee.photoPath) {
    const photoFile = path.resolve(env.UPLOAD_DIR, path.basename(employee.photoPath))
    if (fs.existsSync(photoFile)) {
      try {
        doc.image(photoFile, 50, cursorY, { fit: [120, 120], align: 'center' })
      } catch {
        // ignore broken image
      }
    }
  }
  doc.fontSize(20).fillColor('#0F172A').text(employee.fullName, 190, cursorY)
  doc.fontSize(12).fillColor('#475569').text(employee.position, 190, cursorY + 28)
  doc.text(employee.department, 190, cursorY + 46)

  if (archetype) {
    doc.roundedRect(190, cursorY + 70, 200, 30, 6).fill(accent)
    doc.fillColor('#FFFFFF').fontSize(14).text(ARCHETYPE_LABEL[archetype], 200, cursorY + 78)
    doc.fillColor('#000000')
  }

  cursorY += 150

  if (latest) {
    doc.fontSize(14).fillColor('#0F172A').text('Stats', 50, cursorY)
    cursorY += 20
    drawBar(doc, 'Skill', latest.skillScore, '#3B82F6', 50, cursorY)
    cursorY += 28
    drawBar(doc, 'Will', latest.willScore, '#A855F7', 50, cursorY)
    cursorY += 40
    doc.fontSize(11).fillColor('#475569')
       .text(`Assessed: ${new Date(latest.takenAt).toISOString().slice(0, 10)} · Source: ${(latest as any).source ?? 'ADMIN'}`, 50, cursorY)
    cursorY += 30
  }

  if (aiPlan) {
    doc.fontSize(14).fillColor('#0F172A').text('Development Plan', 50, cursorY)
    cursorY += 20
    doc.fontSize(10).fillColor('#1F2937').text(aiPlan, 50, cursorY, {
      width: doc.page.width - 100,
      align: 'left',
    })
  }

  doc.end()
  return doc as unknown as NodeJS.ReadableStream
}

// ──────────────────────────────────────────────────────────
// Roster table PDF
// ──────────────────────────────────────────────────────────
export function buildRosterPdf(rows: EmployeeRow[]): NodeJS.ReadableStream {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 })

  // Header
  doc.rect(0, 0, doc.page.width, 70).fill('#0F172A')
  doc.fillColor('#FFFFFF').fontSize(22).text('Employee Roster', 40, 22)
  doc.fontSize(10).fillColor('#94A3B8').text(
    `TAS Consulting · ${new Date().toISOString().slice(0, 10)} · ${rows.length} employees`,
    40,
    50
  )
  doc.fillColor('#000000')

  let y = 100
  const colWidths = [180, 140, 130, 110, 60, 60, 90]
  const colX = [40]
  for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i])

  // Table header
  doc.rect(40, y - 4, doc.page.width - 80, 22).fill('#F1F5F9')
  doc.fillColor('#0F172A').fontSize(9)
  ;['Name', 'Position', 'Department', 'Archetype', 'Skill', 'Will', 'Last Assessed'].forEach((h, i) => {
    doc.text(h, colX[i] + 6, y, { width: colWidths[i] - 12 })
  })
  y += 22

  doc.fontSize(9).fillColor('#1F2937')
  for (const r of rows) {
    if (y > doc.page.height - 50) {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 })
      y = 40
    }
    // Zebra
    if ((rows.indexOf(r) % 2) === 0) {
      doc.rect(40, y - 4, doc.page.width - 80, 22).fill('#F8FAFC')
      doc.fillColor('#1F2937')
    }
    doc.text(r.fullName, colX[0] + 6, y, { width: colWidths[0] - 12, lineBreak: false })
    doc.text(r.position, colX[1] + 6, y, { width: colWidths[1] - 12, lineBreak: false })
    doc.text(r.department, colX[2] + 6, y, { width: colWidths[2] - 12, lineBreak: false })

    if (r.archetype) {
      const c = ARCHETYPE_COLORS[r.archetype]
      doc.roundedRect(colX[3] + 6, y - 1, colWidths[3] - 14, 14, 3).fill(c)
      doc.fillColor('#FFFFFF').fontSize(8)
        .text(ARCHETYPE_LABEL[r.archetype], colX[3] + 10, y + 2, { width: colWidths[3] - 22, lineBreak: false })
      doc.fillColor('#1F2937').fontSize(9)
    } else {
      doc.fillColor('#94A3B8').text('—', colX[3] + 6, y).fillColor('#1F2937')
    }

    doc.text(r.skillScore != null ? r.skillScore.toFixed(0) : '—', colX[4] + 6, y, { width: colWidths[4] - 12, lineBreak: false })
    doc.text(r.willScore != null ? r.willScore.toFixed(0) : '—', colX[5] + 6, y, { width: colWidths[5] - 12, lineBreak: false })
    doc.text(
      r.lastAssessedAt ? new Date(r.lastAssessedAt).toISOString().slice(0, 10) : '—',
      colX[6] + 6, y, { width: colWidths[6] - 12, lineBreak: false }
    )
    y += 22
  }

  doc.end()
  return doc as unknown as NodeJS.ReadableStream
}

// ──────────────────────────────────────────────────────────
// Dashboard / analytics PDF
// ──────────────────────────────────────────────────────────
export function buildDashboardPdf(args: {
  overview: { total: number; assessed: number; unassessed: number; counts: Record<Archetype, number> }
  byDept: Array<{
    department: string
    total: number
    assessed: number
    avgSkill: number
    avgWill: number
    counts: Record<Archetype, number>
  }>
  topPerformers: Array<{
    fullName: string
    department: string
    position: string
    archetype: Archetype
    skillScore: number
    willScore: number
  }>
}): NodeJS.ReadableStream {
  const { overview, byDept, topPerformers } = args
  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill('#0F172A')
  doc.fillColor('#FFFFFF').fontSize(22).text('Team Dashboard', 50, 28)
  doc.fontSize(10).fillColor('#94A3B8').text(
    `TAS Consulting · ${new Date().toISOString().slice(0, 10)}`,
    50, 56
  )
  doc.fillColor('#000000')

  let y = 110
  const pct = overview.total ? Math.round((overview.assessed / overview.total) * 100) : 0

  // KPI section
  doc.fontSize(11).fillColor('#64748B').text('OVERVIEW', 50, y)
  y += 18
  drawKpiBox(doc, 50, y, 'Total Employees', String(overview.total), '#0F172A')
  drawKpiBox(doc, 175, y, 'Assessed', `${overview.assessed} (${pct}%)`, '#3B82F6')
  drawKpiBox(doc, 300, y, 'Unassessed', String(overview.unassessed), '#94A3B8')
  drawKpiBox(doc, 425, y, 'Departments', String(byDept.length), '#A855F7')
  y += 80

  // Archetype mix
  doc.fontSize(11).fillColor('#64748B').text('ARCHETYPE DISTRIBUTION', 50, y)
  y += 18
  const archetypes: Archetype[] = ['DELEGATE', 'COACH', 'INSPIRE_SUPPORT', 'TELL']
  for (const a of archetypes) {
    const count = overview.counts[a] || 0
    const archetypePct = overview.assessed ? (count / overview.assessed) * 100 : 0
    doc.fontSize(10).fillColor('#1F2937').text(ARCHETYPE_LABEL[a], 50, y, { width: 130 })
    doc.fontSize(10).fillColor('#475569').text(`${count} · ${archetypePct.toFixed(0)}%`, 460, y)
    doc.roundedRect(180, y + 2, 270, 10, 5).stroke('#E2E8F0')
    doc.roundedRect(180, y + 2, Math.max(2, (archetypePct / 100) * 270), 10, 5).fill(ARCHETYPE_COLORS[a])
    doc.fillColor('#000000')
    y += 22
  }

  y += 12

  // By department
  if (byDept.length) {
    doc.fontSize(11).fillColor('#64748B').text('BY DEPARTMENT', 50, y)
    y += 18

    const cols = [
      { label: 'Department', x: 50, w: 150 },
      { label: 'Total', x: 200, w: 50 },
      { label: 'Assessed', x: 250, w: 60 },
      { label: 'Avg Skill', x: 310, w: 70 },
      { label: 'Avg Will', x: 380, w: 70 },
      { label: 'Top Archetype', x: 450, w: 100 },
    ]

    doc.rect(50, y - 3, doc.page.width - 100, 20).fill('#F1F5F9')
    doc.fontSize(9).fillColor('#0F172A')
    cols.forEach((c) => doc.text(c.label, c.x + 4, y, { width: c.w - 8, lineBreak: false }))
    y += 22

    doc.fontSize(9).fillColor('#1F2937')
    byDept.forEach((d, i) => {
      if (i % 2 === 0) doc.rect(50, y - 3, doc.page.width - 100, 18).fill('#F8FAFC')
      const topArch = (Object.keys(d.counts) as Archetype[])
        .sort((a, b) => d.counts[b] - d.counts[a])[0]
      doc.fillColor('#1F2937')
      doc.text(d.department, cols[0].x + 4, y, { width: cols[0].w - 8, lineBreak: false })
      doc.text(String(d.total), cols[1].x + 4, y, { width: cols[1].w - 8, lineBreak: false })
      doc.text(String(d.assessed), cols[2].x + 4, y, { width: cols[2].w - 8, lineBreak: false })
      doc.text(String(d.avgSkill || '—'), cols[3].x + 4, y, { width: cols[3].w - 8, lineBreak: false })
      doc.text(String(d.avgWill || '—'), cols[4].x + 4, y, { width: cols[4].w - 8, lineBreak: false })
      if (topArch && d.counts[topArch] > 0) {
        doc.fillColor(ARCHETYPE_COLORS[topArch])
          .text(ARCHETYPE_LABEL[topArch], cols[5].x + 4, y, { width: cols[5].w - 8, lineBreak: false })
        doc.fillColor('#1F2937')
      } else {
        doc.fillColor('#94A3B8').text('—', cols[5].x + 4, y).fillColor('#1F2937')
      }
      y += 18
    })
    y += 12
  }

  // Top performers
  if (topPerformers.length) {
    if (y > doc.page.height - 200) { doc.addPage(); y = 50 }
    doc.fontSize(11).fillColor('#64748B').text('TOP PERFORMERS', 50, y)
    y += 18
    topPerformers.forEach((p, i) => {
      const rank = i + 1
      doc.roundedRect(50, y - 2, 30, 22, 4).fill('#F1F5F9')
      doc.fontSize(11).fillColor('#0F172A').text(String(rank), 50, y + 3, { width: 30, align: 'center' })
      doc.fontSize(10).fillColor('#1F2937').text(p.fullName, 90, y, { width: 200, lineBreak: false })
      doc.fontSize(9).fillColor('#64748B').text(`${p.position} · ${p.department}`, 90, y + 12, { width: 200, lineBreak: false })
      doc.fontSize(9).fillColor(ARCHETYPE_COLORS[p.archetype])
        .text(ARCHETYPE_LABEL[p.archetype], 300, y, { width: 120, lineBreak: false })
      doc.fillColor('#1F2937').text(`S ${p.skillScore.toFixed(0)} · W ${p.willScore.toFixed(0)}`, 440, y, { width: 120, lineBreak: false })
      y += 28
    })
  }

  doc.end()
  return doc as unknown as NodeJS.ReadableStream
}

function drawKpiBox(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value: string, accent: string) {
  doc.roundedRect(x, y, 110, 60, 6).fill('#F8FAFC')
  doc.rect(x, y, 4, 60).fill(accent)
  doc.fontSize(8).fillColor('#64748B').text(label.toUpperCase(), x + 12, y + 8, { width: 100 })
  doc.fontSize(18).fillColor('#0F172A').text(value, x + 12, y + 22, { width: 100 })
  doc.fillColor('#000000')
}

function drawBar(doc: PDFKit.PDFDocument, label: string, value: number, color: string, x: number, y: number) {
  doc.fontSize(11).fillColor('#1F2937').text(label, x, y)
  doc.text(`${value.toFixed(1)}`, x + 460, y)
  doc.roundedRect(x + 60, y + 4, 400, 12, 6).stroke('#CBD5E1')
  doc
    .roundedRect(x + 60, y + 4, Math.max(8, (value / 100) * 400), 12, 6)
    .fill(color)
}
