import type { Request, Response, NextFunction } from 'express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId || !req.session.twoFAVerified) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId || !req.session.twoFAVerified) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  if (req.session.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Superadmin required' })
  }
  next()
}
