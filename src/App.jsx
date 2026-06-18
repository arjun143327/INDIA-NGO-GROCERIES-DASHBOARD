import { Navigate, Route, Routes } from 'react-router-dom'
import PageShell from './components/layout/PageShell'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import NgoDashboard from './pages/ngo/NgoDashboard'
import SchoolDashboard from './pages/school/SchoolDashboard'
import { ErrorBoundary } from './components/ErrorBoundary'

function RequireAuth({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen bg-app-surfaceAlt" />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RoleRoute({ role, children }) {
  const { profile, loading } = useAuth()

  if (loading || !profile) {
    return <div className="min-h-screen bg-app-surfaceAlt" />
  }

  if (profile.role !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

function RoleRedirect() {
  const { profile, loading } = useAuth()

  if (loading || !profile) {
    return <div className="min-h-screen bg-app-surfaceAlt" />
  }

  return <Navigate to={profile.role === 'ngo_admin' ? '/ngo' : '/school'} replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <PageShell />
          </RequireAuth>
        }
      >
        <Route index element={<RoleRedirect />} />
        <Route
          path="school"
          element={
            <RoleRoute role="school_staff">
              <SchoolDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="ngo"
          element={
            <RoleRoute role="ngo_admin">
              <NgoDashboard />
            </RoleRoute>
          }
        />
      </Route>
    </Routes>
    </ErrorBoundary>
  )
}
