import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode,     setMode]     = useState('login')   // 'login' | 'register'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setDone(true)
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  function translateError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль'
    if (msg.includes('User already registered'))   return 'Этот email уже зарегистрирован'
    if (msg.includes('Password should be'))        return 'Пароль должен быть не менее 6 символов'
    if (msg.includes('Unable to validate'))        return 'Неверный email'
    return msg
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">🎂</div>
          <h1 className="auth-title">Проверьте почту</h1>
          <p className="auth-subtitle">
            Мы отправили письмо на <strong>{email}</strong>.<br />
            Подтвердите адрес, затем войдите в аккаунт.
          </p>
          <button className="btn btn--primary auth-btn" onClick={() => { setDone(false); setMode('login') }}>
            Войти
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">🎂</div>
        <h1 className="auth-title">Дни рождения</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Войдите в свой аккаунт' : 'Создайте аккаунт'}
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Вход
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' auth-tab--active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Пароль</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            type="submit"
            className="btn btn--primary auth-btn"
            disabled={loading}
          >
            {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  )
}
