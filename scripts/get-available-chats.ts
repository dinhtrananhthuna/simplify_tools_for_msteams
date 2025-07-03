import { getValidAuthToken } from '../lib/auth';

async function getAvailableChats() {
  try {
    console.log('🔍 Getting available Teams chats...');
    
    // Get valid token
    const token = await getValidAuthToken();
    if (!token) {
      console.log('❌ No valid token found. Please authenticate first:');
      console.log('   http://localhost:3000/admin/auth');
      return;
    }
    
    console.log('✅ Found valid token');
    
    // Get chats list
    const response = await fetch('https://graph.microsoft.com/v1.0/me/chats?$top=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Failed to get chats:', response.status, error);
      return;
    }
    
    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      console.log('📭 No chats found');
      return;
    }
    
    console.log(`\n📱 Found ${data.value.length} available chats:\n`);
    
    data.value.forEach((chat: any, index: number) => {
      console.log(`${index + 1}. Chat ID: ${chat.id}`);
      console.log(`   Topic: ${chat.topic || 'No topic'}`);
      console.log(`   Type: ${chat.chatType}`);
      console.log(`   Members: ${chat.members?.length || 'Unknown'}`);
      
      // Validate format
      const isValidFormat = chat.id.includes('@thread.v2') || chat.id.includes('@thread.skype');
      console.log(`   Format: ${isValidFormat ? '✅ Valid' : '⚠️ May be invalid'}`);
      console.log('   ---');
    });
    
    console.log('\n💡 To update PR Notifier with new chat ID:');
    console.log('1. Copy one of the Chat IDs above');
    console.log('2. Go to: http://localhost:3000/admin/tools/pr-notifier');
    console.log('3. Paste the new Chat ID and save');
    
  } catch (error) {
    console.error('❌ Error getting chats:', error);
  } finally {
    process.exit(0);
  }
}

getAvailableChats().catch(console.error); 