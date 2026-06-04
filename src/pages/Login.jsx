import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const disabled = useMemo(() => !email || !password || submitting, [email, password, submitting])

  async function handleLogin() {
    setSubmitting(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Could not sign in. Check your email and password.')
    }

    setSubmitting(false)
  }

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-surfaceAlt px-5">
      <div className="w-full max-w-md rounded-lg border border-app-border bg-app-surface p-6">
        <div className="mb-6">
          <div className="text-[16px] font-semibold text-app-textPrimary">India NGO Grocery Tracker</div>
          <div className="mt-2 text-[12px] text-app-textSecondary">
            Sign in with your assigned account to access the school or NGO dashboard.
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-app-textSecondary">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-app-textSecondary">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[34px] w-full rounded-lg border border-app-border bg-white px-3 text-[12px] text-app-textPrimary"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-app-red bg-app-redBg px-3 py-2 text-[11px] text-app-red">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogin}
          disabled={disabled}
          className="mt-5 h-[32px] w-full rounded-lg bg-app-greenMid text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
