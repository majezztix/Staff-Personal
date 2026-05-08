import 'express-session'
import type { AdminRole } from '@prisma/client'

declare module 'express-session' {
  interface SessionData {
    adminId?: string
    role?: AdminRole
    twoFAVerified?: boolean
    pendingAdminId?: string
  }
}
