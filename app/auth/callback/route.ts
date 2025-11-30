import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (!error) {
    // Get the session to verify it's set
    const { data: { session } } = await supabase.auth.getSession();
    
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    // Create redirect response
    let redirectUrl = `${origin}${next}`;
    if (!isLocalEnv && forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    }
    
    const response = NextResponse.redirect(redirectUrl);
    
    // Set a cookie to indicate successful auth (will be picked up by client)
    response.cookies.set('auth_redirect', 'success', {
      httpOnly: false, // Allow client to read
      maxAge: 10, // Expire after 10 seconds
      path: '/',
    });
    
    return response;
  }
  } else {
    return NextResponse.redirect(`${origin}/?error=auth_callback_error`);
  }
}

