import { getValidAuthToken } from './auth';

// Simple Teams client sử dụng fetch thuần
export class SimpleTeamsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  static async create(): Promise<SimpleTeamsClient> {
    const token = await getValidAuthToken();
    if (!token) {
      throw new Error('No valid access token found');
    }
    return new SimpleTeamsClient(token);
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `https://graph.microsoft.com/v1.0${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  async getUserInfo() {
    console.log('📊 Getting user info...');
    return this.makeRequest('/me');
  }

  async getChats(limit: number = 3) {
    console.log(`📋 Getting ${limit} chats with members info...`);
    return this.makeRequest(`/me/chats?$top=${limit}&$select=id,topic,chatType,members&$expand=members`);
  }

  async sendMessage(chatId: string, message: string | any, contentType: 'text' | 'html' | 'adaptiveCard' = 'html') {
    console.log(`📤 Sending message to chat: ${chatId}`);
    
    let messagePayload: any;
    
    if (contentType === 'adaptiveCard' && typeof message === 'object') {
      // Generate unique ID for attachment (required by Graph API)
      const attachmentId = crypto.randomUUID();
      
      // Send Adaptive Card with correct Graph API format (content phải là string)
      messagePayload = {
        body: {
          content: `<attachment id=\"${attachmentId}\"></attachment>`,
          contentType: 'html',
        },
        attachments: [{
          id: attachmentId,
          contentType: message.contentType || "application/vnd.microsoft.card.adaptive",
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content || message)
        }]
      };
      
      console.log('📋 Adaptive Card payload:', JSON.stringify(messagePayload, null, 2));
    } else {
      // Send regular text/html message
      messagePayload = {
        body: {
          content: typeof message === 'string' ? message : JSON.stringify(message),
          contentType: contentType === 'adaptiveCard' ? 'html' : contentType,
        },
      };
    }
    
    return this.makeRequest(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messagePayload),
    });
  }
}

// Helper functions
export async function getSimpleUserInfo() {
  console.log('🔍 Getting user info with simple client...');
  
  try {
    const client = await SimpleTeamsClient.create();
    const userInfo = await client.getUserInfo();
    
    return {
      displayName: userInfo.displayName,
      mail: userInfo.mail || userInfo.userPrincipalName,
      id: userInfo.id,
    };
  } catch (error) {
    console.error('❌ Failed to get user info:', error);
    throw error;
  }
}

export async function getSimpleChats(limit: number = 3) {
  console.log(`🔍 Getting ${limit} chats with simple client...`);
  
  try {
    const client = await SimpleTeamsClient.create();
    const response = await client.getChats(limit);
    
    // Lấy thông tin user hiện tại để filter oneOnOne chats
    let currentUserId = null;
    try {
      const userInfo = await client.getUserInfo();
      currentUserId = userInfo.id;
      console.log(`👤 Current user: ${userInfo.displayName} (ID: ${currentUserId})`);
    } catch (error) {
      console.log('⚠️ Could not get current user info');
    }
    
    return response.value?.map((chat: any) => {
      let displayName = chat.topic;
      
      // Nếu là oneOnOne chat và không có topic, hiển thị tên người đối thoại
      if (chat.chatType === 'oneOnOne' && !displayName && chat.members) {
        // Tìm member không phải là chính mình (current user)
        const otherMember = chat.members.find((member: any) => 
          member.userId && 
          member.displayName && 
          member.userId !== currentUserId &&
          !member.displayName.includes('Application') &&
          !member.displayName.includes('Bot')
        );
        
        if (otherMember) {
          displayName = `${otherMember.displayName}`;
          console.log(`💬 OneOnOne chat: ${displayName} (ID: ${otherMember.userId})`);
        } else {
          console.log(`⚠️ Could not find other member in oneOnOne chat:`, chat.members);
        }
      }
      
      // Fallback cho các trường hợp khác
      if (!displayName) {
        switch (chat.chatType) {
          case 'oneOnOne':
            displayName = '1:1 Chat';
            break;
          case 'group':
            const memberCount = chat.members?.length || 0;
            displayName = chat.topic || `Group Chat (${memberCount} members)`;
            break;
          case 'meeting':
            displayName = chat.topic || 'Meeting Chat';
            break;
          default:
            displayName = `${chat.chatType} Chat`;
        }
      }
      
      return {
        id: chat.id,
        displayName,
        chatType: chat.chatType,
        memberCount: chat.members?.length || 0,
        members: chat.members?.map((member: any) => ({
          id: member.userId,
          displayName: member.displayName,
          email: member.email
        })) || []
      };
    }) || [];
  } catch (error) {
    console.error('❌ Failed to get chats:', error);
    throw error;
  }
}

export async function sendSimpleMessage(chatId: string, message: string | any, contentType: 'text' | 'html' | 'adaptiveCard' = 'html') {
  console.log(`📤 Sending message with simple client...`);
  
  try {
    const client = await SimpleTeamsClient.create();
    const result = await client.sendMessage(chatId, message, contentType);
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    throw error;
  }
} 