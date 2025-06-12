import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('🔍 Middleware called for:', request.nextUrl.pathname);

  // Allow login page, login API, and Teams OAuth routes to be accessed without auth
  if (request.nextUrl.pathname === '/admin/login' || 
      request.nextUrl.pathname === '/api/auth/login' ||
      request.nextUrl.pathname === '/api/auth/teams' ||
      request.nextUrl.pathname === '/api/auth/teams/callback' ||
      request.nextUrl.pathname === '/api/auth/teams/status') {
    console.log('✅ Allowing auth access');
    return NextResponse.next();
  }

  // Special handling for /admin/auth with OAuth callback parameters
  if (request.nextUrl.pathname === '/admin/auth' && 
      (request.nextUrl.searchParams.has('success') || request.nextUrl.searchParams.has('error'))) {
    console.log('✅ Allowing Teams OAuth callback result page');
    return NextResponse.next();
  }

  // Protect all other admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('🔒 Admin route detected, checking auth...');
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader?.startsWith('Basic ')) {
      console.log('❌ No valid auth header, redirecting to login');
      // Redirect to login page instead of showing browser auth prompt
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      
      const validUsername = process.env.ADMIN_USERNAME || 'admin';
      const validPassword = process.env.ADMIN_PASSWORD || 'password';
      
      console.log('🔐 Checking credentials for user:', username);
      console.log('🔧 Expected username:', validUsername);
      console.log('🔧 Expected password:', validPassword ? '***' : 'NOT SET');
      
      if (username !== validUsername || password !== validPassword) {
        console.log('❌ Invalid credentials, redirecting to login');
        console.log('❌ Provided username:', username);
        console.log('❌ Provided password:', password ? '***' : 'EMPTY');
        const loginUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      console.log('✅ Valid credentials, allowing access');
    } catch (error) {
      console.log('❌ Error parsing credentials:', error);
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Security headers for all routes
  const response = NextResponse.next();
  
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
}; 