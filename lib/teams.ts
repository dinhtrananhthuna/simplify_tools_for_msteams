import { getValidAuthToken, getRefreshToken } from './auth';

// Teams OAuth configuration
const TEAMS_CONFIG = {
  clientId: process.env.TEAMS_CLIENT_ID!,
  clientSecret: process.env.TEAMS_CLIENT_SECRET!,
  tenantId: process.env.TEAMS_TENANT_ID!,
  scopes: [
    'offline_access',
    'https://graph.microsoft.com/Chat.ReadWrite',
    'https://graph.microsoft.com/TeamMember.Read.All',
    'https://graph.microsoft.com/User.Read',
  ],
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/auth/teams/callback`
    : `http://localhost:3000/api/auth/teams/callback`,
};

// ============ OAuth Functions ============

// Get OAuth authorization URL
export function getTeamsAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: TEAMS_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: TEAMS_CONFIG.redirectUri,
    scope: TEAMS_CONFIG.scopes.join(' '),
    response_mode: 'query',
    tenant: TEAMS_CONFIG.tenantId,
  });

  return `https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/authorize?${params}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}> {
  console.log('🔄 exchangeCodeForTokens: Starting token exchange...');
  console.log('📝 exchangeCodeForTokens: Code length:', code?.length || 0);
  
  const response = await fetch(`https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TEAMS_CONFIG.clientId,
      client_secret: TEAMS_CONFIG.clientSecret,
      code,
      redirect_uri: TEAMS_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  console.log('📡 exchangeCodeForTokens: Response status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ exchangeCodeForTokens: Token exchange failed:', error);
    throw new Error(`Token exchange failed: ${error}`);
  }

  const result = await response.json();
  
  console.log('✅ exchangeCodeForTokens: Response received:', {
    hasAccessToken: !!result.access_token,
    hasRefreshToken: !!result.refresh_token,
    accessTokenLength: result.access_token?.length || 0,
    refreshTokenLength: result.refresh_token?.length || 0,
    expiresIn: result.expires_in,
    scope: result.scope,
    tokenType: result.token_type
  });

  return result;
}

// Simple auth status check (without Graph API validation)
export async function checkTeamsAuthStatus(): Promise<{
  isAuthenticated: boolean;
  userInfo?: any;
  error?: string;
}> {
  try {
    console.log('🔍 Checking Teams auth status...');
    
    // Check if we have a valid token in database
    const token = await getValidAuthToken();
    console.log('🎯 Valid token from DB:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ No valid token found in database');
      return {
        isAuthenticated: false,
        error: 'No valid authentication token found',
      };
    }
    
    // Return authenticated status based on token existence
    // We'll validate the token when actually using it, not during status check
    console.log('✅ Valid token found in database');
    return {
      isAuthenticated: true,
      userInfo: {
        displayName: 'Teams User',
        email: 'authenticated@teams.microsoft.com',
        id: 'token-validated',
      },
    };
  } catch (error) {
    console.error('❌ Teams auth status check failed:', error);
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Teams Client (Fetch API) ============

// Simple Teams client using direct fetch API
export class TeamsClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  static async create(): Promise<TeamsClient> {
    const token = await getValidAuthToken();
    if (!token) {
      throw new Error('No valid access token found');
    }
    return new TeamsClient(token);
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

// ============ Helper Functions ============

export async function getUserInfo() {
  console.log('🔍 Getting user info with Teams client...');
  
  try {
    const client = await TeamsClient.create();
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

export async function getTeamsChats(limit: number = 3) {
  console.log(`🔍 Getting ${limit} chats with Teams client...`);
  
  try {
    const client = await TeamsClient.create();
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

export async function sendTeamsMessage(chatId: string, message: string | any, contentType: 'text' | 'html' | 'adaptiveCard' = 'html') {
  console.log(`📤 Sending message with Teams client...`);
  
  try {
    const client = await TeamsClient.create();
    const result = await client.sendMessage(chatId, message, contentType);
    
    return result.id;
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    throw error;
  }
}

// ============ Legacy Aliases (for backward compatibility) ============

// Keep old function names for backward compatibility
export const SimpleTeamsClient = TeamsClient;
export const getSimpleUserInfo = getUserInfo;
export const getSimpleChats = getTeamsChats;
export const sendSimpleMessage = sendTeamsMessage;

// ============ Message Formatting Functions ============

// Format pull request message as Adaptive Card
export function formatPullRequestMessage(prData: {
  title: string;
  author: string;
  repository: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
  description?: string;
  mentions?: string[];
}): any {
  // Extract images from description if present
  const images: string[] = [];
  let cleanDescription = prData.description || '';
  
  if (cleanDescription) {
    // Extract markdown images: ![alt](url)
    const markdownImageRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = markdownImageRegex.exec(cleanDescription)) !== null) {
      const imageUrl = match[1];
      // Skip Azure DevOps attachment URLs (they require authentication)
      if (!imageUrl.includes('/_apis/git/repositories/') || !imageUrl.includes('/attachments/')) {
        images.push(imageUrl);
      }
    }
    
    // Extract HTML images: <img src="url">
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlImageRegex.exec(cleanDescription)) !== null) {
      const imageUrl = match[1];
      // Skip Azure DevOps attachment URLs
      if (!imageUrl.includes('/_apis/git/repositories/') || !imageUrl.includes('/attachments/')) {
        images.push(imageUrl);
      }
    }
    
    // Remove image syntax from description for cleaner display
    cleanDescription = cleanDescription
      .replace(/!\[.*?\]\([^)]+\)/g, '') // Remove markdown images
      .replace(/<img[^>]*>/gi, '') // Remove HTML images
      .trim();
  }
  
  // Limit to 3 images to prevent oversized cards
  const displayImages = images.slice(0, 3);
  
  // Build card body elements
  const bodyElements: any[] = [
    {
      type: "TextBlock",
      text: prData.title,
      weight: "Bolder",
      size: "Medium",
      wrap: true
    },
    {
      type: "FactSet",
      facts: [
        {
          title: "Author:",
          value: prData.author
        },
        {
          title: "Repository:",
          value: prData.repository
        },
        {
          title: "Branch:",
          value: `${prData.sourceBranch} → ${prData.targetBranch}`
        }
      ]
    }
  ];
  
  // Add description if present
  if (cleanDescription && cleanDescription.length > 0) {
    bodyElements.push({
      type: "TextBlock",
      text: cleanDescription.length > 200 ? cleanDescription.substring(0, 200) + '...' : cleanDescription,
      wrap: true,
      spacing: "Medium",
      color: "Good"
    });
  }
  
  // Add images if present
  if (displayImages.length > 0) {
    displayImages.forEach(imageUrl => {
      bodyElements.push({
        type: "Image",
        url: imageUrl,
        size: "Medium",
        spacing: "Medium"
      });
    });
    
    // Add warning if there were more images
    if (images.length > 3) {
      bodyElements.push({
        type: "TextBlock",
        text: `⚠️ ${images.length - 3} more image(s) not shown`,
        size: "Small",
        color: "Warning",
        spacing: "Small"
      });
    }
  }
  
  // Add Azure DevOps attachment warning if found
  if (prData.description && (prData.description.includes('/_apis/git/repositories/') && prData.description.includes('/attachments/'))) {
    bodyElements.push({
      type: "TextBlock",
      text: "⚠️ Some images from Azure DevOps attachments cannot be displayed (authentication required)",
      size: "Small",
      color: "Warning",
      spacing: "Small"
    });
  }
  
  // Add mentions if enabled
  if (prData.mentions && prData.mentions.length > 0) {
    const mentionText = prData.mentions.map(user => `<at>${user}</at>`).join(' ');
    bodyElements.push({
      type: "TextBlock",
      text: `📢 ${mentionText} - Please review this pull request`,
      wrap: true,
      spacing: "Medium"
    });
  }

  // add text block to notify user to review the pull request
    bodyElements.push({
      type: "TextBlock",
      text: "Please review this pull request and provide your feedback.",
      wrap: true,
      spacing: "Medium",
      isSubtle: true
    });
  
  
  const adaptiveCard = {
    contentType: "application/vnd.microsoft.card.adaptive",
    content: {
      type: "AdaptiveCard",
      version: "1.4",
      body: bodyElements,
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View Pull Request",
          url: prData.url
        }
      ]
    }
  };

  return adaptiveCard;
}

// Format pull request message as HTML (fallback)
export function formatPullRequestMessageHTML(prData: {
  title: string;
  author: string;
  repository: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
  description?: string;
  mentions?: string[];
}): string {
  let html = `
    <h3>🔔 New Pull Request</h3>
    <p><strong>${prData.title}</strong></p>
    <ul>
      <li><strong>Author:</strong> ${prData.author}</li>
      <li><strong>Repository:</strong> ${prData.repository}</li>
      <li><strong>Branch:</strong> ${prData.sourceBranch} → ${prData.targetBranch}</li>
    </ul>
  `;
  
  if (prData.description && prData.description.trim().length > 0) {
    const shortDescription = prData.description.length > 200 
      ? prData.description.substring(0, 200) + '...' 
      : prData.description;
    html += `<p><strong>Description:</strong><br/>${shortDescription}</p>`;
  }
  
  if (prData.mentions && prData.mentions.length > 0) {
    const mentionText = prData.mentions.map(user => `<at>${user}</at>`).join(' ');
    html += `<p>📢 ${mentionText} - Please review this pull request</p>`;
  }
  
  html += `<p><a href="${prData.url}">👉 View Pull Request</a></p>`;
  
  return html;
}



 