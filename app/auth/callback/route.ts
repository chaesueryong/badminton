import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {

      // Get the redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let baseUrl: string

      if (isLocalEnv) {
        // Development: use origin
        baseUrl = origin
      } else if (forwardedHost) {
        // Production with forwarded host
        baseUrl = `https://${forwardedHost}`
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        // Production with environment variable
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      } else {
        // Fallback to origin
        baseUrl = origin
      }

      // Check if user has a profile
      const { data: profile } = await supabase
        .from('users')
        .select('name, nickname')
        .eq('id', data.user.id)
        .maybeSingle()

      // If no profile or no name/nickname, redirect to onboarding
      if (!profile || (!profile.name && !profile.nickname)) {
        console.log('No profile or missing name/nickname, redirecting to onboarding')
        return NextResponse.redirect(`${baseUrl}/onboarding?first_login=true`)
      }

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // Return the user to an error page with instructions
  const errorRedirectUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/auth-code-error`
    : `${origin}/auth/auth-code-error`

  return NextResponse.redirect(errorRedirectUrl)
}