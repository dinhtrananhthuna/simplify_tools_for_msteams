import { getAuthStatus } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Add timeout to prevent Vercel timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Status check timeout')), 25000); // 25 second timeout
    });
    
    const statusPromise = getAuthStatus();
    
    const authStatus = await Promise.race([statusPromise, timeoutPromise]) as Awaited<ReturnType<typeof getAuthStatus>>;
    
    return Response.json({
      success: true,
      ...authStatus,
      // Add mock user info if authenticated but no specific user info
      userInfo: authStatus.isAuthenticated ? {
        displayName: 'Teams User',
        email: 'authenticated@teams.microsoft.com',
        id: 'authenticated-user'
      } : undefined
    });
  } catch (error) {
    console.error('Failed to check Teams auth status:', error);
    
    return Response.json({
      success: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 