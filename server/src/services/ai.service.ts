import { getAnthropic, ANTHROPIC_MODEL } from '../lib/anthropic.js'
import type { Archetype, Assessment, Employee } from '@prisma/client'

const SYSTEM_PROMPT = `คุณคือที่ปรึกษาด้าน Leadership Development ที่เชี่ยวชาญโมเดล Hersey-Blanchard Situational Leadership

โมเดล Hersey-Blanchard แบ่งพนักงานออกเป็น 4 ประเภทตามแกน Skill (ความสามารถ) × Will (แรงจูงใจ):

1. **DELEGATE** (Skill สูง, Will สูง) — ผู้ใหญ่ทางวิชาชีพ ไม่ต้องการ micromanagement ให้อิสระและมอบหมายงานท้าทาย
2. **COACH** (Skill ต่ำ, Will สูง) — มีไฟ มีความทะเยอทะยาน แต่สกิลยังไม่พอ ต้องการการสอน-แนะนำ-feedback
3. **INSPIRE SUPPORT** (Skill สูง, Will ต่ำ) — เก่งแต่หมดไฟ ต้องการการเติมแรงบันดาลใจ ฟัง รับรู้คุณค่า
4. **TELL** (Skill ต่ำ, Will ต่ำ) — ต้องการคำสั่งและคำแนะนำชัดเจน step-by-step ไม่ปล่อยให้คิดเอง

หน้าที่ของคุณ: เขียนแผนพัฒนา 30/60/90 วัน เป็นภาษาไทย professional ใช้ markdown

โครงสร้างที่ต้องตอบ:
## สรุปสถานะปัจจุบัน
(2-3 ประโยค สรุปจุดแข็ง/จุดที่ต้องพัฒนา)

## แผน 30 วันแรก (Quick Wins)
- ...

## แผน 60 วัน (Skill / Motivation Building)
- ...

## แผน 90 วัน (Sustainable Growth)
- ...

## แนวทางสำหรับหัวหน้า
- ...

## ตัวชี้วัดความสำเร็จ
- ...

ใช้ tone ที่ให้กำลังใจ ตรงประเด็น ไม่ตัดสิน เน้น actionable items`

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  DELEGATE: 'DELEGATE (ปล่อยให้ทำเอง)',
  COACH: 'COACH (สอน-แนะนำ)',
  INSPIRE_SUPPORT: 'INSPIRE SUPPORT (เติมแรงบันดาลใจ)',
  TELL: 'TELL (สั่งงานชัดเจน)',
}

export async function generateDevPlan(args: {
  employee: Pick<Employee, 'fullName' | 'position' | 'department'>
  assessment: Pick<Assessment, 'archetype' | 'skillScore' | 'willScore' | 'takenAt'>
  history?: { archetype: Archetype; takenAt: Date }[]
}): Promise<string> {
  const client = getAnthropic()
  if (!client) {
    throw new Error('AI not configured (set ANTHROPIC_API_KEY in .env)')
  }

  const { employee, assessment, history = [] } = args
  const trend = history.length
    ? history
        .slice(0, 5)
        .map((h) => `${h.takenAt.toISOString().slice(0, 10)}: ${h.archetype}`)
        .join('\n')
    : 'ไม่มีประวัติก่อนหน้า'

  const userMessage = `ข้อมูลพนักงาน:
- ชื่อ: ${employee.fullName}
- ตำแหน่ง: ${employee.position}
- แผนก: ${employee.department}

ผลประเมินล่าสุด (วันที่ ${assessment.takenAt.toISOString().slice(0, 10)}):
- Archetype: ${ARCHETYPE_LABEL[assessment.archetype]}
- Skill Score: ${assessment.skillScore.toFixed(1)} / 100
- Will Score: ${assessment.willScore.toFixed(1)} / 100

ประวัติ archetype:
${trend}

กรุณาเขียนแผนพัฒนา 30/60/90 วันสำหรับพนักงานคนนี้ ตามโครงสร้างที่กำหนดไว้`

  const resp = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = resp.content.find((c) => c.type === 'text')
  if (!block || block.type !== 'text') throw new Error('No text in AI response')
  return block.text
}
