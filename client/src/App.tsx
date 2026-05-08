import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './store/auth'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Setup2FA from './pages/Setup2FA'
import Verify2FA from './pages/Verify2FA'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import EmployeeDetail from './pages/EmployeeDetail'
import EmployeeForm from './pages/EmployeeForm'
import Assessment from './pages/Assessment'
import Analytics from './pages/Analytics'
import Questions from './pages/Questions'
import Admins from './pages/Admins'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated, pending, loading, needs2FASetup, needs2FAVerify } = useAuth()
  const location = useLocation()
  if (loading) return <div className="grid h-screen place-items-center text-ink-400">Loading…</div>
  if (!authenticated) {
    if (pending && needs2FASetup) return <Navigate to="/setup-2fa" replace state={{ from: location }} />
    if (pending && needs2FAVerify) return <Navigate to="/verify-2fa" replace state={{ from: location }} />
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export default function App() {
  const { refresh } = useAuth()
  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup-2fa" element={<Setup2FA />} />
      <Route path="/verify-2fa" element={<Verify2FA />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="roster" element={<Roster />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="employees/:id/assess" element={<Assessment />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="questions" element={<Questions />} />
        <Route path="admins" element={<Admins />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
