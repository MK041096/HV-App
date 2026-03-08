import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /auth/callback - Handle Supabase auth callbacks (password reset, email confirmation)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Determine redirect based on the type of callback
      const type = searchParams.get('type')

      if (type === 'recovery') {
        // Password reset flow - redirect to reset password page
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }

      // Default: redirect to next page (dashboard)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
