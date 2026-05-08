import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { env } from '../lib/env.js'

const dir = path.resolve(env.UPLOAD_DIR)
fs.mkdirSync(dir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext || '.bin'}`)
  },
})

const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

export const photoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowed.has(ext)) return cb(new Error('Only image files allowed'))
    cb(null, true)
  },
})
