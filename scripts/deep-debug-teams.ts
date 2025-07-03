import { executeQuery } from '../lib/db';
import { getValidAuthToken } from '../lib/auth';

async function deepDebugTeams() {
  try {
    console.log('🔍 Deep debugging Teams integration...');
    
    // 1. Kiểm tra token status chi tiết
    console.log('\n🔑 Token Analysis:');
    const token = await getValidAuthToken();
    if (!token) {
      console.log('❌ No valid token found');
      return;
    }
    console.log('✅ Token available, length:', token.length);
    
    // 2. Test Graph API permissions trực tiếp
    console.log('\n🌐 Testing Graph API directly...');
    
    // Test /me endpoint
    try {
      const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (meResponse.ok) {
        const userData = await meResponse.json();
        console.log('✅ /me endpoint works');
        console.log('- User:', userData.displayName);
        console.log('- Email:', userData.mail || userData.userPrincipalName);
        console.log('- Tenant:', userData.companyName || 'Unknown');
      } else {
        const error = await meResponse.text();
        console.log('❌ /me endpoint failed:', meResponse.status, error);
      }
    } catch (error) {
      console.log('❌ /me endpoint error:', error);
    }
    
    // Test /me/chats endpoint
    console.log('\n📋 Testing /me/chats endpoint...');
    try {
      const chatsResponse = await fetch('https://graph.microsoft.com/v1.0/me/chats?$top=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        console.log('✅ /me/chats endpoint works');
        console.log(`- Found ${chatsData.value?.length || 0} chats`);
        
        if (chatsData.value && chatsData.value.length > 0) {
          console.log('\n📱 Available chats:');
          chatsData.value.forEach((chat: any, index: number) => {
            console.log(`${index + 1}. ID: ${chat.id}`);
            console.log(`   Topic: ${chat.topic || 'No topic'}`);
            console.log(`   Type: ${chat.chatType}`);
            console.log('   ---');
          });
          
          // Check specific chat ID
          const targetChatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
          const targetChat = chatsData.value.find((chat: any) => chat.id === targetChatId);
          
          if (targetChat) {
            console.log(`✅ Target chat ${targetChatId} found in list!`);
            console.log('- Topic:', targetChat.topic || 'No topic');
            console.log('- Type:', targetChat.chatType);
          } else {
            console.log(`❌ Target chat ${targetChatId} NOT found in accessible chats!`);
            console.log('This is the ROOT CAUSE of the "Invalid ThreadId" error.');
            console.log('\n💡 Solution: Use one of the accessible chat IDs above');
          }
        }
      } else {
        const error = await chatsResponse.text();
        console.log('❌ /me/chats failed:', chatsResponse.status, error);
      }
    } catch (error) {
      console.log('❌ /me/chats error:', error);
    }
    
    // Test specific chat endpoint
    console.log('\n🎯 Testing specific chat access...');
    const targetChatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
    
    try {
      const chatResponse = await fetch(`https://graph.microsoft.com/v1.0/chats/${targetChatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('✅ Direct chat access works');
        console.log('- Topic:', chatData.topic);
        console.log('- Type:', chatData.chatType);
      } else {
        const error = await chatResponse.text();
        console.log('❌ Direct chat access failed:', chatResponse.status);
        console.log('Error details:', error);
        
        if (chatResponse.status === 404) {
          console.log('\n🔍 404 Analysis:');
          console.log('- Chat may have been deleted');
          console.log('- User may have been removed from chat');
          console.log('- Chat may be from different tenant');
          console.log('- Insufficient permissions');
        }
      }
    } catch (error) {
      console.log('❌ Direct chat test error:', error);
    }
    
    // Test message sending với chat ID khác
    console.log('\n📤 Testing message send to a valid chat...');
    try {
      const chatsResponse = await fetch('https://graph.microsoft.com/v1.0/me/chats?$top=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        if (chatsData.value && chatsData.value.length > 0) {
          const testChatId = chatsData.value[0].id;
          console.log(`Testing with chat: ${testChatId}`);
          
          const messagePayload = {
            body: {
              content: '🧪 PR Notifier debug test - please ignore this message',
              contentType: 'text'
            }
          };
          
          const sendResponse = await fetch(`https://graph.microsoft.com/v1.0/chats/${testChatId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagePayload)
          });
          
          if (sendResponse.ok) {
            const messageData = await sendResponse.json();
            console.log('✅ Message send works! Message ID:', messageData.id);
            console.log('The issue is specifically with the configured chat ID');
          } else {
            const error = await sendResponse.text();
            console.log('❌ Message send failed:', sendResponse.status, error);
          }
        }
      }
    } catch (error) {
      console.log('❌ Test send error:', error);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('If target chat is not in accessible chats list above,');
    console.log('you need to update PR Notifier config with a valid chat ID.');
    
  } catch (error) {
    console.error('❌ Deep debug failed:', error);
  } finally {
    process.exit(0);
  }
}

deepDebugTeams(); 