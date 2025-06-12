import { getUserChats } from '../../../../lib/teams';

export async function GET() {
  try {
    const chats = await getUserChats();
    
    return Response.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error('Failed to get Teams chats:', error);
    
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Teams chats',
      chats: [],
    });
  }
} 