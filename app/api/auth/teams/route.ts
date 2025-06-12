import { NextRequest } from 'next/server';
import { getTeamsAuthUrl } from '@/lib/teams';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authUrl = getTeamsAuthUrl();
    
    // Redirect user to Teams OAuth
    return Response.redirect(authUrl);
  } catch (error) {
    console.error('Teams auth initiation failed:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Failed to initiate Teams authentication' 
      },
      { status: 500 }
    );
  }
} 