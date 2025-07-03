import { TeamsClient } from '../lib/teams';

async function testRealMessage() {
  try {
    console.log('🧪 Testing Real Message Send to Teams...\n');
    
    // Chat ID từ config của bạn
    const chatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
    console.log('🎯 Target Chat ID:', chatId);
    
    // Tạo Teams client
    console.log('🔗 Creating Teams client...');
    const client = await TeamsClient.create();
    console.log('✅ Teams client created successfully');
    
    // Test 1: Gửi như group chat (có thể sẽ fail)
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Test 1: Sending as GROUP CHAT');
    console.log('='.repeat(60));
    
    const target1 = { 
      id: chatId, 
      type: 'group' 
    };
    
    try {
      const result1 = await client.sendMessage(
        target1, 
        '🧪 Test message from script - Group Chat attempt', 
        'text'
      );
      console.log('✅ SUCCESS! Message sent as group chat');
      console.log('📝 Message ID:', result1);
      return; // Nếu thành công thì dừng
    } catch (error1: any) {
      console.log('❌ Failed as group chat:', error1.message);
      
      if (error1.message && error1.message.includes('Invalid ThreadId')) {
        console.log('🔍 This confirms it\'s likely a channel, not a group chat');
      }
    }
    
    // Test 2: Để hệ thống tự động detect (auto-recovery logic)
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Test 2: Let system AUTO-DETECT (recovery logic)');
    console.log('='.repeat(60));
    
    try {
      // Không set type, để hệ thống tự detect
      const target2 = { id: chatId };
      
      const result2 = await client.sendMessage(
        target2, 
        '🧪 Test message from script - Auto-detection attempt', 
        'text'
      );
      console.log('✅ SUCCESS! Message sent via auto-detection');
      console.log('📝 Message ID:', result2);
      return;
    } catch (error2: any) {
      console.log('❌ Auto-detection also failed:', error2.message);
    }
    
    // Test 3: Thử với các team IDs khác nhau
    console.log('\n' + '='.repeat(60));
    console.log('🔄 Test 3: Manual team detection');
    console.log('='.repeat(60));
    
    try {
      // Skip manual team detection since makeRequest is private
      console.log('⚠️ Skipping manual team detection (requires private method access)');
      
    } catch (error3: any) {
      console.log('❌ Manual team detection failed:', error3.message);
    }
    
    // Test 4: Debug thông tin về chat ID này
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Test 4: DEBUG - Get chat info');
    console.log('='.repeat(60));
    
    try {
      // Skip chat info debug since makeRequest is private
      console.log('⚠️ Skipping chat info debug (requires private method access)');
    } catch (chatError: any) {
      console.log('❌ Cannot get chat info:', chatError.message);
    }
    
    console.log('\n❌ All tests failed. This chat ID might be:');
    console.log('1. From a different tenant/organization');
    console.log('2. A deleted chat/channel');
    console.log('3. User no longer has access');
    console.log('4. App doesn\'t have the right permissions');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
}

// Chạy test
testRealMessage().catch(console.error); 