import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function bootstrap() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)

      if (currentSession?.user?.id) {
        await fetchProfile(currentSession.user.id)
      } else {
        setLoading(false)
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user?.id) {
        await fetchProfile(nextSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      setProfile(null)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
