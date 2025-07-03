import { TeamsClient } from '../lib/teams';
import { executeQuery } from '../lib/db';
import { getValidAuthToken } from '../lib/auth';

async function deepDebugTeams() {
  console.log('🔍 Deep debugging Teams integration...');
  
  try {
    // Test 1: Database and token
    console.log('\n=== Test 1: Database & Token ===');
    const token = await getValidAuthToken();
    if (!token) {
      console.log('❌ No valid token found');
      return;
    }
    console.log('✅ Valid token found');
    
    // Test 2: Teams client
    console.log('\n=== Test 2: Teams Client ===');
    const client = await TeamsClient.create();
    console.log('✅ Teams client created');
    
    // Test 3: Get chats
    console.log('\n=== Test 3: Get Chats ===');
    let chatsData: any[] = [];
    try {
      chatsData = await client.getChats(5);
      console.log(`- Found ${chatsData?.length || 0} chats`);
      
      if (chatsData && chatsData.length > 0) {
        console.log('- Chat details:');
        chatsData.forEach((chat: any, index: number) => {
          console.log(`  ${index + 1}. ${chat.id}`);
          console.log(`     Name: ${chat.displayName || chat.topic || 'Unknown'}`);
          console.log(`     Type: ${chat.type || chat.chatType || 'Unknown'}`);
        });
        
        // Try to find our target chat
        const targetChatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
        const targetChat = chatsData.find((chat: any) => chat.id === targetChatId);
        if (targetChat) {
          console.log(`✅ Found target chat: ${targetChat.displayName || targetChat.topic || 'Unknown'}`);
        } else {
          console.log('⚠️ Target chat not found in user\'s chat list');
        }
      } else {
        console.log('- No chats found');
      }
    } catch (error) {
      console.log('❌ Failed to get chats:', error);
    }
    
    // Test 4: Send test message
    console.log('\n=== Test 4: Send Message ===');
    try {
      if (chatsData && chatsData.length > 0) {
        const testChatId = chatsData[0].id;
        console.log(`- Sending test message to: ${testChatId}`);
        
        const target = { id: testChatId, type: 'group' }; // Assume group chat
        const messageId = await client.sendMessage(target, 'Test message from debug script', 'text');
        console.log(`✅ Message sent successfully: ${messageId}`);
      } else {
        console.log('⚠️ No chats available for testing');
      }
    } catch (error) {
      console.log('❌ Failed to send message:', error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

deepDebugTeams().catch(console.error); 