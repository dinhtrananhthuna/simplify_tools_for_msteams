import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow access to all routes

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