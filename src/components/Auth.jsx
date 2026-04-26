import React, { useState } from 'react'

const FEATURES = [
  'Real-time financial health score',
  'Smart loan prepayment simulator',
  'AI-powered spending insights',
  'SIP & investment tracker',
]

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      if (!form.email || !form.password) return setError('Please enter your email and password.')
      onLogin({ name: form.email.split('@')[0], email: form.email.toLowerCase() })
    } else {
      if (!form.name || !form.email || !form.password) return setError('Please fill in all fields.')
      if (form.password !== form.confirm) return setError('Passwords do not match.')
      onLogin({ name: form.name.trim(), email: form.email.toLowerCase() })
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setForm({ name: '', email: '', password: '', confirm: '' })
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon">FT</div>
          <div className="auth-logo-text">FinTrack</div>
        </div>
        <div className="auth-tagline">Your personal finance<br />command center</div>
        <div className="auth-sub">
          Track savings, loans, expenses and net worth — all in one place with AI-powered insights.
        </div>
        <div className="auth-features">
          {FEATURES.map((f) => (
            <div key={f} className="auth-feature">
              <div className="auth-feature-dot" />{f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-logo">
          <div className="auth-form-logo-icon">FT</div>
          <div className="auth-form-logo-text">Fin<span>Track</span></div>
        </div>
        <div className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <div className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your FinTrack dashboard' : 'Start managing your finances today'}
        </div>
        <div className="auth-sub" style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>
          ℹ️ Data is stored locally in your browser — each email gets its own private workspace.
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} />
            </div>
          )}
          <div className="auth-input-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
            </div>
          )}
          <button type="submit" className="auth-btn">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <>
            <div className="auth-divider">or try demo</div>
            <button
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14 }}
              onClick={() => onLogin({ name: 'Demo User', email: 'demo@fintrack.app' })}
            >
              Continue with Demo Account
            </button>
          </>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => switchMode('signup')}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => switchMode('login')}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  )
}
