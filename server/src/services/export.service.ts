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
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  }
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  rows.forEach((r) => ws.addRow(r))
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

const ARCHETYPE_COLORS: Record<Archetype, string> = {
  DELEGATE: '#F59E0B',
  COACH: '#3B82F6',
  INSPIRE_SUPPORT: '#A855F7',
  TELL: '#EF4444',
}

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  DELEGATE: 'DELEGATE',
  COACH: 'COACH',
  INSPIRE_SUPPORT: 'INSPIRE SUPPORT',
  TELL: 'TELL',
}

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
  doc.fontSize(12).text(`TAS Consulting · ${new Date().toISOString().slice(0, 10)}`, 50, 70)
  doc.fillColor('#000000')

  // Photo
  let cursorY = 130
  if (employee.photoPath) {
    const photoFile = path.resolve(env.UPLOAD_DIR, path.basename(employee.photoPath))
    if (fs.existsSync(photoFile)) {
      try {
        doc.image(photoFile, 50, cursorY, { fit: [120, 120] })
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

  // Stats
  if (latest) {
    doc.fontSize(14).fillColor('#0F172A').text('Stats', 50, cursorY)
    cursorY += 20
    drawBar(doc, 'Skill', latest.skillScore, '#3B82F6', 50, cursorY)
    cursorY += 28
    drawBar(doc, 'Will', latest.willScore, '#A855F7', 50, cursorY)
    cursorY += 40
  }

  // AI Plan
  if (aiPlan) {
    doc.fontSize(14).fillColor('#0F172A').text('Development Plan', 50, cursorY)
    cursorY += 20
    doc.fontSize(10).fillColor('#1F2937').text(aiPlan, 50, cursorY, {
      width: doc.page.width - 100,
      align: 'left',
    })
  }

  doc.end()
  return doc
}

function drawBar(doc: PDFKit.PDFDocument, label: string, value: number, color: string, x: number, y: number) {
  doc.fontSize(11).fillColor('#1F2937').text(label, x, y)
  doc.text(`${value.toFixed(1)}`, x + 460, y)
  doc.roundedRect(x + 60, y + 4, 400, 12, 6).stroke('#CBD5E1')
  doc
    .roundedRect(x + 60, y + 4, Math.max(8, (value / 100) * 400), 12, 6)
    .fill(color)
}
