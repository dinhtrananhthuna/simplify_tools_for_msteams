import { TeamsClient } from '../lib/teams';

async function validateChatId() {
  try {
    console.log('🔍 Validating Chat ID...');
    
    // Chat ID từ config
    const chatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
    console.log('Target Chat ID:', chatId);
    
    // Tạo Teams client
    const client = await TeamsClient.create();
    console.log('✅ Teams client created successfully');
    
    // 1. Kiểm tra user info
    console.log('\n👤 Current user info:');
    try {
      const userInfo = await client.getUserInfo();
      console.log('- Display Name:', userInfo.displayName);
      console.log('- Email:', userInfo.mail || userInfo.userPrincipalName);
      console.log('- User ID:', userInfo.id);
    } catch (error) {
      console.log('❌ Failed to get user info:', error);
    }
    
    // 2. Lấy danh sách chats có sẵn
    console.log('\n📋 Available chats:');
    try {
      const chatsResponse = await client.getChats(10);
      const chats = chatsResponse.value || [];
      
      console.log(`Found ${chats.length} chats:`);
      chats.forEach((chat: any) => {
        console.log(`- ${chat.id}: ${chat.topic || chat.chatType || 'Unknown'}`);
        
        // Check if this is our target chat
        if (chat.id === chatId) {
          console.log('  ✅ This is our target chat!');
        }
      });
      
      // Check if target chat exists in the list
      const targetChat = chats.find((chat: any) => chat.id === chatId);
      if (!targetChat) {
        console.log(`\n⚠️  Target chat ${chatId} not found in user's chat list!`);
        console.log('This could mean:');
        console.log('1. Chat was deleted');
        console.log('2. User left the chat'); 
        console.log('3. Chat is from another tenant');
        console.log('4. App permissions insufficient');
      } else {
        console.log('\n✅ Target chat found in chat list');
      }
      
    } catch (error) {
      console.log('❌ Failed to get chats:', error);
    }
    
    // 3. Thử gửi test message
    console.log('\n📤 Testing message send...');
    try {
      const testMessage = {
        body: {
          content: '🧪 Test message from PR Notifier validation script',
          contentType: 'text'
        }
      };
      
      const result = await client.sendMessage(chatId, testMessage, 'text');
      console.log('✅ Test message sent successfully!');
      console.log('Message ID:', result.id);
      
    } catch (error) {
      console.log('❌ Failed to send test message:', error);
      
      if (error instanceof Error && error.message.includes('Invalid ThreadId')) {
        console.log('\n🔍 Invalid ThreadId error analysis:');
        console.log('- This means the chat ID is not accessible by current user/app');
        console.log('- Possible causes:');
        console.log('  1. Chat was deleted');
        console.log('  2. User was removed from chat');
        console.log('  3. Chat is from external tenant (permissions issue)');
        console.log('  4. Teams app not properly configured');
        
        console.log('\n💡 Solutions:');
        console.log('1. Get a new chat ID from current available chats');
        console.log('2. Re-add user to the target chat');
        console.log('3. Check Teams app permissions');
      }
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    process.exit(0);
  }
}

validateChatId(); 