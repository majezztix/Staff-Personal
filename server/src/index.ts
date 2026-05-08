import express from 'express'
import session from 'express-session'
import ConnectPgSimple from 'connect-pg-simple'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { env } from './lib/env.js'

import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import employeeRoutes from './routes/employee.routes.js'
import questionRoutes from './routes/question.routes.js'
import assessmentRoutes from './routes/assessment.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import aiRoutes from './routes/ai.routes.js'
import exportRoutes from './routes/export.routes.js'

const app = express()
const PgStore = ConnectPgSimple(session)

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'))

app.use(
  session({
    store: new PgStore({
      conString: env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: false,
    }),
    name: 'tas.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8, // 8h
    },
  })
)

app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/admins', adminRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/export', exportRoutes)

app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal error' })
})

app.listen(env.PORT, () => {
  console.log(`[server] listening on http://localhost:${env.PORT}`)
})
