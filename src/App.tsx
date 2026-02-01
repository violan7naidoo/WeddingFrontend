import { AuthProvider } from './context/AuthContext'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

function AppContent() {
  const { token, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    )
  }

  if (!token || !user) {
    return <LoginPage />
  }

  return <DashboardPage />
}

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <AppContent />
      </div>
    </AuthProvider>
  )
}

export default App
