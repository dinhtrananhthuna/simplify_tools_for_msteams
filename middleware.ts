import { NextRequest, NextResponse } from 'next/server';

function validateBasicAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }
  
  try {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    return username === process.env.ADMIN_USER && 
           password === process.env.ADMIN_PASS;
  } catch {
    return false;
  }
}

function createAuthResponse(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
      'Content-Type': 'text/plain',
    },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow webhook endpoints to bypass authentication
  const isWebhookEndpoint = 
    pathname === '/api/webhooks/teams-bot' ||
    pathname.startsWith('/api/webhooks/azure-devops/');
  
  // Check if this is an admin route (excluding API routes)
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Apply basic auth to admin pages only
  if (isAdminRoute && !isWebhookEndpoint) {
    if (!validateBasicAuth(request)) {
      return createAuthResponse();
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