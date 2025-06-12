import { clearAuthTokens } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🗑️ Clearing all auth tokens...');
    
    await clearAuthTokens();
    
    console.log('✅ All tokens cleared successfully');
    
    return Response.json({
      success: true,
      message: 'All authentication tokens have been cleared. Please re-authenticate with Teams.',
      nextStep: 'Go to /admin/auth and click "Connect to Teams"'
    });
    
  } catch (error) {
    console.error('❌ Failed to clear tokens:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 