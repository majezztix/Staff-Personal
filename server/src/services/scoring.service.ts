import type { Archetype, Question } from '@prisma/client'
import { env } from '../lib/env.js'

export type Answer = { questionId: string; value: number }

export type ScoreResult = {
  skillScore: number
  willScore: number
  archetype: Archetype
}

export function classify(skill: number, will: number): Archetype {
  const T = env.SCORE_THRESHOLD
  const HI_S = skill >= T
  const HI_W = will >= T
  if (HI_S && HI_W) return 'DELEGATE'
  if (!HI_S && HI_W) return 'COACH'
  if (HI_S && !HI_W) return 'INSPIRE_SUPPORT'
  return 'TELL'
}

/**
 * Likert 1-5; reversed questions invert (6 - value).
 * Per axis: weighted average normalized to 0-100.
 */
export function score(questions: Question[], answers: Answer[]): ScoreResult {
  const byId = new Map(questions.map((q) => [q.id, q]))
  let skillNum = 0
  let skillDen = 0
  let willNum = 0
  let willDen = 0

  for (const a of answers) {
    const q = byId.get(a.questionId)
    if (!q || !q.active) continue
    const raw = q.reversed ? 6 - a.value : a.value
    const normalized = (raw - 1) / 4 // 0..1
    const w = q.weight
    if (q.axis === 'SKILL') {
      skillNum += normalized * w
      skillDen += w
    } else {
      willNum += normalized * w
      willDen += w
    }
  }

  const skillScore = skillDen ? (skillNum / skillDen) * 100 : 0
  const willScore = willDen ? (willNum / willDen) * 100 : 0

  return {
    skillScore: round2(skillScore),
    willScore: round2(willScore),
    archetype: classify(skillScore, willScore),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
