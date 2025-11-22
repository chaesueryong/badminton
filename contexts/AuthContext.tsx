'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  name?: string
  profileImage?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  signInWithKakao: () => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadUserProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
        return
      }

      if (!data) {
        // Profile doesn't exist, create it
        console.log('Creating new user profile for:', userId, userEmail, userName)

        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail || '',
            name: userName || '',
            profileImage: '/default-avatar.png',
            onboarding_completed: false,  // 온보딩 미완료 상태로 생성
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        } else if (newProfile) {
          console.log('Successfully created user profile:', newProfile)
          setProfile(newProfile)
        }
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
        loadUserProfile(session.user.id, session.user.email, userName)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const userName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
        loadUserProfile(session.user.id, session.user.email, userName)

        // Check for redirect path after login
        if (typeof window !== 'undefined') {
          const redirectPath = sessionStorage.getItem('redirectAfterLogin')
          if (redirectPath) {
            sessionStorage.removeItem('redirectAfterLogin')
            window.location.href = redirectPath
          }
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id, user.email)
    }
  }

  const value: AuthContextType = useMemo(() => ({
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signInWithKakao,
    signOut,
    refreshProfile,
  }), [user, profile, session, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}