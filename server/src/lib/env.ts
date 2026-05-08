import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: required('DATABASE_URL'),
  SESSION_SECRET: required('SESSION_SECRET'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  SCORE_THRESHOLD: Number(process.env.SCORE_THRESHOLD || 50),
  TOTP_ISSUER: process.env.TOTP_ISSUER || 'TAS Employee Cards',
  DISABLE_2FA: process.env.DISABLE_2FA === 'true',
  INITIAL_ADMIN_USERNAME: process.env.INITIAL_ADMIN_USERNAME || 'Admin',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || '$TASAdmin$',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}
