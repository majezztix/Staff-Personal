import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    return Promise.reject(err)
  }
)

export type Archetype = 'DELEGATE' | 'COACH' | 'INSPIRE_SUPPORT' | 'TELL'
export type AdminRole = 'SUPERADMIN' | 'ADMIN'

export type Question = {
  id: string
  text: string
  axis: 'SKILL' | 'WILL'
  reversed: boolean
  weight: number
  order: number
  active: boolean
}

export type Employee = {
  id: string
  fullName: string
  email: string | null
  position: string
  department: string
  startDate: string | null
  photoPath: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  latest?: {
    id: string
    archetype: Archetype
    skillScore: number
    willScore: number
    takenAt: string
  } | null
}

export type Assessment = {
  id: string
  employeeId: string
  takenAt: string
  archetype: Archetype
  skillScore: number
  willScore: number
  aiPlan: string | null
  notes: string | null
  takenBy?: { id: string; username: string }
}

export type Admin = {
  id: string
  username: string
  role: AdminRole
  totpEnabled: boolean
  createdAt: string
}
