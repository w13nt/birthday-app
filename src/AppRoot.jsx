import { useAuth } from './contexts/AuthContext'
import App        from './App.jsx'
import AuthScreen from './components/AuthScreen.jsx'

export default function AppRoot() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-logo">🎂</div>
      </div>
    )
  }

  return user ? <App /> : <AuthScreen />
}
