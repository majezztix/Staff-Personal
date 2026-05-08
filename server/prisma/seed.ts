import 'dotenv/config'
import { PrismaClient, type QAxis } from '@prisma/client'
import bcrypt from 'bcrypt'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const prisma = new PrismaClient()

const __dirname = dirname(fileURLToPath(import.meta.url))

type SeedQuestion = { axis: QAxis; text: string; reversed?: boolean; weight?: number }

async function ensureSessionTable() {
  // connect-pg-simple expects a `session` table; we created the model in schema.prisma,
  // but it requires the canonical column types. Recreate to match its schema.
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    ) WITH (OIDS=FALSE);
  `)
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
    EXCEPTION
      WHEN duplicate_table THEN NULL;
      WHEN duplicate_object THEN NULL;
      WHEN invalid_table_definition THEN NULL;
    END $$;
  `)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`)
}

async function main() {
  console.log('🌱 Seeding...')

  await ensureSessionTable()

  // 1. Initial superadmin
  const username = process.env.INITIAL_ADMIN_USERNAME || 'Admin'
  const password = process.env.INITIAL_ADMIN_PASSWORD || '$TASAdmin$'

  const existing = await prisma.admin.findUnique({ where: { username } })
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.admin.create({
      data: {
        username,
        passwordHash,
        role: 'SUPERADMIN',
      },
    })
    console.log(`  ✓ Created superadmin: ${username}`)
  } else {
    console.log(`  · Superadmin "${username}" already exists`)
  }

  // 2. Questions
  const file = resolve(__dirname, '../src/data/questions.seed.json')
  const questions = JSON.parse(readFileSync(file, 'utf-8')) as SeedQuestion[]

  const existingCount = await prisma.question.count()
  if (existingCount === 0) {
    await prisma.$transaction(
      questions.map((q, i) =>
        prisma.question.create({
          data: {
            text: q.text,
            axis: q.axis,
            reversed: q.reversed ?? false,
            weight: q.weight ?? 1,
            order: i + 1,
            active: true,
          },
        })
      )
    )
    console.log(`  ✓ Inserted ${questions.length} questions`)
  } else {
    console.log(`  · ${existingCount} questions already exist (skip seeding)`)
  }

  console.log('✅ Done')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
