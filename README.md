# TAS Employee Archetype Cards

วิเคราะห์พนักงานผ่านแบบสอบถามเชิงจิตวิทยา (Hersey-Blanchard Situational Leadership) และจัดกลุ่มเป็น 4 ประเภท: **DELEGATE / COACH / INSPIRE SUPPORT / TELL** พร้อม UI สไตล์เกมการ์ด turn-based

## Stack

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React + Vite + Tailwind + Framer Motion
- **Auth**: Session + bcrypt + TOTP (Google Authenticator)
- **AI**: Anthropic Claude (development plan generator) — optional

## Quick Start

```bash
# 1. Copy env file
cp .env.example .env
# แก้ SESSION_SECRET และ ANTHROPIC_API_KEY (ถ้ามี)

# 2. Start Postgres
docker compose up -d

# 3. Install dependencies
npm run setup

# 4. Migrate + seed (creates initial admin: Admin / $TASAdmin$ + 50 questions)
npm run db:migrate
npm run db:seed

# 5. Run dev (server :3000 + client :5173)
npm run dev
```

เปิด http://localhost:5173 → login → setup 2FA ครั้งแรกด้วย Google Authenticator

## OneDrive Note

โฟลเดอร์โปรเจคอยู่ใน OneDrive — หลัง `npm install` ครั้งแรก ให้ตั้ง `node_modules/` (ทั้ง `server/` และ `client/`) ให้ "Free up space" เพื่อกัน OneDrive sync ล้านไฟล์

## Project Layout

```
employee-cards/
├── server/        # Express + Prisma API
├── client/        # React + Vite UI
└── docker-compose.yml
```

ดูรายละเอียดในแต่ละ folder
