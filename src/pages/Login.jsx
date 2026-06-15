import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import logo from '../assets/logo.png'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const disabled = useMemo(() => !email || !password || submitting, [email, password, submitting])

  async function handleLogin(e) {
    if (e) e.preventDefault()
    setSubmitting(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
    }
    // If successful, AuthContext onAuthStateChange will handle navigation
  }

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-app-surfaceAlt font-sans text-app-textPrimary selection:bg-app-greenPale selection:text-app-greenDark">
      {/* Left Column - Branding */}
      <div className="relative flex flex-col items-center justify-center bg-app-greenDark p-8 md:w-[45%] md:p-12 lg:p-16">
        {/* Subtle decorative texture/pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-8">
            <img src={logo} alt="India NGO" className="h-40 md:h-52 w-auto drop-shadow-md" />
          </div>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            School Meal Inventory
          </h1>
          <p className="text-[15px] leading-relaxed text-white/80 md:text-[16px]">
            Track daily grocery usage, monitor stock levels, and support uninterrupted school meals. Helping teams manage kitchen supplies with clarity and care.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-app-textPrimary">Sign In</h2>
            <p className="mt-2 text-[14px] text-app-textSecondary">
              Sign in with your assigned school or NGO account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="rounded-xl border border-app-border bg-app-surface p-6 sm:p-8 shadow-sm shadow-black/5" noValidate>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-app-textPrimary">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 w-full rounded-md border border-app-border bg-white px-3 text-[14px] text-app-textPrimary transition-colors placeholder:text-gray-400 focus:border-app-greenDark focus:outline-none focus:ring-1 focus:ring-app-greenDark"
                  placeholder="name@indiango.org"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-[13px] font-medium text-app-textPrimary">
                    Password
                  </label>
                  <a href="#" className="text-[12px] font-medium text-app-greenMid hover:text-app-greenDark hover:underline focus:outline-none focus:ring-2 focus:ring-app-greenPale focus:ring-offset-1 rounded-sm">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-md border border-app-border bg-white pl-3 pr-10 text-[14px] text-app-textPrimary transition-colors focus:border-app-greenDark focus:outline-none focus:ring-1 focus:ring-app-greenDark"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded text-app-textSecondary hover:text-app-textPrimary focus:outline-none focus:ring-2 focus:ring-app-greenPale"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 flex items-start gap-2 rounded-md border border-app-red/20 bg-app-redBg px-3 py-2.5" role="alert" aria-live="assertive">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-app-red" aria-hidden="true" />
                <span className="text-[13px] text-app-red">{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={disabled}
              className="mt-8 flex h-10 w-full items-center justify-center rounded-md bg-app-greenDark text-[14px] font-medium text-white shadow-sm transition-all hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-app-greenDark focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
            
            <div className="mt-6 text-center text-[12px] text-app-textSecondary border-t border-app-border pt-5">
              Authorized staff access only.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
