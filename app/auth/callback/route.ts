import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server'

// Prevent static generation for OAuth callback
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  try {
    const searchParams = requestUrl.searchParams
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description)
      const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(error_description || error)}`
        : `${origin}/login?error=${encodeURIComponent(error_description || error)}`
      return NextResponse.redirect(errorRedirectUrl)
    }

    if (code) {
      const supabase = await createClient()
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

      if (!sessionError && data?.user) {
        // Check if this is a new user
        const isNewUser = data.user.created_at === data.user.last_sign_in_at

        // Get the redirect URL
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        let baseUrl: string

        if (isLocalEnv) {
          baseUrl = origin
        } else if (forwardedHost) {
          baseUrl = `https://${forwardedHost}`
        } else if (process.env.NEXT_PUBLIC_SITE_URL) {
          baseUrl = process.env.NEXT_PUBLIC_SITE_URL
        } else {
          baseUrl = origin
        }

        // If new user, check if they have a profile
        if (isNewUser) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('name')
              .eq('id', data.user.id)
              .single()

            // If no profile or no name, redirect to onboarding
            if (!profile || !profile.name) {
              return NextResponse.redirect(`${baseUrl}/onboarding?first_login=true`)
            }
          } catch (profileError) {
            console.error('Error checking profile:', profileError)
            // Continue to home even if profile check fails
          }
        }

        return NextResponse.redirect(`${baseUrl}${next}`)
      } else {
        console.error('Session exchange error:', sessionError)
        const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(sessionError?.message || 'auth-failed')}`
          : `${origin}/login?error=${encodeURIComponent(sessionError?.message || 'auth-failed')}`
        return NextResponse.redirect(errorRedirectUrl)
      }
    }

    // No code parameter
    const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no-code`
      : `${origin}/login?error=no-code`
    return NextResponse.redirect(errorRedirectUrl)

  } catch (error) {
    console.error('Callback route error:', error)
    // Fallback redirect on any error - must use absolute URL
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=callback-error`
      : `${origin || 'https://badmate.club'}/login?error=callback-error`
    return NextResponse.redirect(fallbackUrl)
  }
}