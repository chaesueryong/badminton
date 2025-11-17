import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  })
}
