import { getUserChats } from '../../../../lib/teams';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 API: Starting Teams chats request...');
    
    // Add timeout to prevent Vercel timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Chats API timeout')), 25000); // 25 second timeout
    });
    
    const chatsPromise = getUserChats();
    
    const chats = await Promise.race([chatsPromise, timeoutPromise]);
    
    console.log('✅ API: Successfully retrieved chats');
    return Response.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error('❌ API: Failed to get Teams chats:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Teams chats';
    
    return Response.json({
      success: false,
      error: errorMessage,
      chats: [],
    }, { status: 500 });
  }
} 