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
    'https://graph.microsoft.com/Team.ReadBasic.All',
    'https://graph.microsoft.com/Group.Read.All',
    'https://graph.microsoft.com/ChannelSettings.Read.All',
  ],
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/auth/teams/callback`
    : `http://localhost:3000/api/auth/teams/callback`,
  // Multi-tenant support: use 'common' for multi-tenant or specific tenant for single-tenant
  authEndpoint: process.env.TEAMS_MULTITENANT_MODE === 'true' ? 'common' : (process.env.TEAMS_TENANT_ID || 'common'),
};

// ============ Multi-tenant OAuth Functions ============

// Get OAuth authorization URL with tenant support
export function getTeamsAuthUrl(tenantId?: string): string {
  const effectiveTenant = tenantId || TEAMS_CONFIG.authEndpoint;
  
  const params = new URLSearchParams({
    client_id: TEAMS_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: TEAMS_CONFIG.redirectUri,
    scope: TEAMS_CONFIG.scopes.join(' '),
    response_mode: 'query',
    tenant: effectiveTenant,
  });

  console.log(`🔗 Building auth URL for tenant: ${effectiveTenant}`);
  return `https://login.microsoftonline.com/${effectiveTenant}/oauth2/v2.0/authorize?${params}`;
}

// Exchange code for tokens with tenant support
export async function exchangeCodeForTokens(code: string, tenantId?: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  tenant_id?: string;
}> {
  const effectiveTenant = tenantId || TEAMS_CONFIG.authEndpoint;
  
  console.log('🔄 exchangeCodeForTokens: Starting token exchange...');
  console.log('📝 exchangeCodeForTokens: Code length:', code?.length || 0);
  console.log('🏢 exchangeCodeForTokens: Target tenant:', effectiveTenant);
  
  const response = await fetch(`https://login.microsoftonline.com/${effectiveTenant}/oauth2/v2.0/token`, {
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
    tokenType: result.token_type,
    tenantId: effectiveTenant
  });

  return {
    ...result,
    tenant_id: effectiveTenant
  };
}

// Handle external tenant authentication
export async function handleExternalTenantAuth(code: string, tenantId: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  tenant_id: string;
}> {
  console.log('🌐 handleExternalTenantAuth: Processing external tenant authentication');
  console.log('🏢 External tenant ID:', tenantId);
  
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
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

  console.log('📡 handleExternalTenantAuth: Response status:', response.status);

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ handleExternalTenantAuth: External tenant auth failed:', error);
    throw new Error(`External tenant authentication failed: ${error}`);
  }

  const result = await response.json();
  
  console.log('✅ handleExternalTenantAuth: External tenant auth successful');
  return {
    ...result,
    tenant_id: tenantId
  };
}

// Detect tenant from JWT token
export function extractTenantFromToken(accessToken: string): string | null {
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
      console.warn('⚠️ Invalid JWT token format');
      return null;
    }
    
    // Decode payload (base64url)
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
    
    // Extract tenant ID from 'tid' claim
    const tenantId = payload.tid;
    console.log('🔍 Extracted tenant ID from token:', tenantId);
    
    return tenantId;
  } catch (error) {
    console.error('❌ Failed to extract tenant from token:', error);
    return null;
  }
}

// Validate if user is from external tenant
export function isExternalUser(accessToken: string): boolean {
  const userTenantId = extractTenantFromToken(accessToken);
  const homeTenantId = TEAMS_CONFIG.tenantId;
  
  const isExternal = userTenantId && userTenantId !== homeTenantId;
  console.log('👤 User tenant check:', {
    userTenant: userTenantId,
    homeTenant: homeTenantId,
    isExternal
  });
  
  return !!isExternal;
}

// ============ Legacy OAuth Functions (Backward Compatibility) ============

// Original function for backward compatibility
export function getTeamsAuthUrlLegacy(): string {
  return getTeamsAuthUrl(TEAMS_CONFIG.tenantId);
}

// Simple auth status check (without Graph API validation)
export async function checkTeamsAuthStatus(): Promise<{
  isAuthenticated: boolean;
  userInfo?: any;
  error?: string;
  isExternal?: boolean;
  tenantId?: string;
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
    
    // Extract tenant information from token
    const tenantId = extractTenantFromToken(token);
    const isExternal = isExternalUser(token);
    
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
      isExternal,
      tenantId: tenantId || undefined,
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
    const fullUrl = endpoint.startsWith('https://') 
      ? endpoint
      : `https://graph.microsoft.com/v1.0${endpoint}`;
      
    console.log(`[TeamsClient] Making request to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TeamsClient] Graph API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle cases where response might be empty (e.g., 204 No Content)
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      // If it's not JSON, it could be a different type of response.
      // For now, we'll just log and return the raw text.
      console.warn('[TeamsClient] Response was not valid JSON, returning raw text.');
      return text;
    }
  }

  async getUserInfo() {
    console.log('📊 Getting user info...');
    return this.makeRequest('/me');
  }

  async getChats(limit: number = 50) {
    console.log(`🔍 [TeamsClient] Getting up to ${limit} chats...`);

    try {
      // Get chats the user is part of & teams they've joined
      const [chatsResponse, teamsResponse] = await Promise.all([
        this.makeRequest(
          `/chats?$top=${limit}&$expand=members&$select=id,chatType,topic,members,createdDateTime`
        ),
        this.makeRequest('/me/joinedTeams?$select=id,displayName'),
      ]);

      const allConversations: any[] = [];

      const chats = chatsResponse?.value;
      // Process 1-on-1 and group chats
      if (chats && Array.isArray(chats)) {
        for (const chat of chats) {
          let chatName: string;
          // In oneOnOne chat, find the other person's name
          if (chat.chatType === 'oneOnOne') {
            // Note: this is not reliable for getting current user's ID
            const otherMember = chat.members?.find((m: any) => m.userId !== this.accessToken);
            chatName = otherMember?.displayName || '1-on-1 Chat';
          } else {
            chatName = chat.topic || 'Group Chat';
          }
          allConversations.push({
            id: chat.id,
            displayName: chatName,
            type: chat.chatType, // 'oneOnOne' or 'group'
            createdDateTime: chat.createdDateTime,
          });
        }
      }

      const teams = teamsResponse?.value;
      // Process Team channels
      if (teams && Array.isArray(teams)) {
        const channelPromises = teams.map(async (team: any) => {
          try {
            const channelsResponse = await this.makeRequest(
              `/teams/${team.id}/channels?$select=id,displayName,createdDateTime`
            );
            const channels = channelsResponse?.value;
            if (channels && Array.isArray(channels)) {
              return channels.map((channel: any) => ({
                id: channel.id,
                teamId: team.id,
                displayName: `${team.displayName} > ${channel.displayName}`,
                type: 'channel',
                createdDateTime: channel.createdDateTime,
              }));
            }
            return [];
          } catch (error) {
            console.error(`❌ [TeamsClient] Failed to get channels for team ${team.displayName}:`, error);
            return [];
          }
        });

        const channelsByTeam = await Promise.all(channelPromises);
        channelsByTeam.flat().forEach(channel => allConversations.push(channel));
      }
      
      console.log(`✅ [TeamsClient] Found ${allConversations.length} conversations.`);
      return allConversations;
    } catch (error) {
      console.error('❌ [TeamsClient] Failed to get chats:', error);
      throw error;
    }
  }

  async sendMessage(
    target: { id: string; type?: string; teamId?: string },
    message: any,
    contentType: 'adaptiveCard' | 'text' | 'html' = 'html'
  ): Promise<string> {
    let endpoint: string;
    let body: any;

    const isChannel = target.type === 'channel' && target.teamId;

    if (isChannel) {
      endpoint = `/teams/${target.teamId}/channels/${target.id}/messages`;
      if (contentType === 'adaptiveCard') {
        // For channels, Adaptive Cards are sent as attachments
        let cardContent;
        if (message && typeof message === 'object') {
          // If message already has contentType and content structure, use the content part
          if (message.contentType && message.content) {
            cardContent = message.content;
          } else if (message.type === 'AdaptiveCard') {
            // If message is directly an Adaptive Card object
            cardContent = message;
          } else {
            // Fallback: assume entire message is the card content
            cardContent = message;
          }
        } else {
          cardContent = message;
        }
        
        body = {
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: cardContent, // Must be object, not string!
            },
          ],
        };
      } else {
        body = {
          body: {
            contentType: contentType,
            content: message,
          },
        };
      }
    } else {
      // This is a 1-on-1 or group chat
      endpoint = `/chats/${target.id}/messages`;
      if (contentType === 'adaptiveCard') {
        // For chats, Adaptive Cards must be sent as attachments
        let cardContent;
        if (message && typeof message === 'object') {
          // If message already has contentType and content structure, use the content part
          if (message.contentType && message.content) {
            cardContent = message.content;
          } else if (message.type === 'AdaptiveCard') {
            // If message is directly an Adaptive Card object
            cardContent = message;
          } else {
            // Fallback: assume entire message is the card content
            cardContent = message;
          }
        } else {
          cardContent = message;
        }
        
        body = {
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: cardContent, // Must be object, not string!
            },
          ],
        };
      } else {
        body = {
          body: {
            contentType: contentType,
            content: message,
          },
        };
      }
    }

    console.log(`📤 Sending message to endpoint: ${endpoint}`);
    console.log(`📝 Target info: ID=${target.id}, Type=${target.type || 'unknown'}, TeamID=${target.teamId || 'none'}`);

    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      console.log('✅ Message sent successfully');
      return response.id;
    } catch (error) {
      const errorResponse = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send message to ${endpoint}:`, errorResponse);
      
      // If sending to chat fails with "Invalid ThreadId" error, this might be a channel
      if (errorResponse.includes('Invalid ThreadId') && !isChannel) {
        console.log('🔄 ThreadId error detected - this might be a channel. Attempting to find the right team...');
        
        try {
          // Try to find which team this channel belongs to
          const teamsResponse = await this.makeRequest('/me/joinedTeams?$select=id,displayName');
          const teams = teamsResponse?.value;
          
          if (teams && Array.isArray(teams)) {
            for (const team of teams) {
              try {
                // List all channels in this team to find the one that matches our conversation ID
                const channelsResponse = await this.makeRequest(`/teams/${team.id}/channels`);
                const channels = channelsResponse?.value || [];
                
                for (const channel of channels) {
                  // Check if this channel's conversation thread ID matches our target ID
                  if (channel.id === target.id) {
                    console.log(`✅ Found channel ${target.id} in team ${team.displayName} (${team.id})`);
                    
                    // Retry sending as channel
                    const channelTarget = { ...target, type: 'channel', teamId: team.id };
                    return this.sendMessage(channelTarget, message, contentType);
                  }
                }
              } catch (channelError) {
                // Channels not accessible in this team, continue searching
                console.log(`❌ Cannot access channels in team ${team.displayName}: ${channelError instanceof Error ? channelError.message : String(channelError)}`);
                continue;
              }
            }
          }
        } catch (retryError) {
          console.error('❌ Failed to auto-detect channel team:', retryError);
        }
      }
      
      // Re-throw with more context
      throw new Error(`Graph API error: ${errorResponse}`);
    }
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
  console.log(`[getTeamsChats] Getting up to ${limit} chats via TeamsClient...`);
  try {
    const client = await TeamsClient.create();
    // The client.getChats method now returns the processed array of conversations directly.
    // No need to access .value or map it again here, as that's already handled inside the client.
    const chats = await client.getChats(limit);
    return chats;
  } catch (error) {
    console.error('❌ Failed to get chats in legacy helper function:', error);
    throw error;
  }
}

/**
 * Sends a message to a Teams chat or channel.
 * @param target - The target conversation.
 * @param message - The message content (string for text/html, JSON object for Adaptive Card).
 * @param contentType - The type of message content.
 * @returns The ID of the sent message.
 */
export interface TeamsMessageTarget {
  id: string;
  type?: 'channel' | 'group' | 'oneOnOne';
  teamId?: string;
}

export async function sendTeamsMessage(
  target: TeamsMessageTarget,
  message: string | any,
  contentType: 'text' | 'html' | 'adaptiveCard' = 'html'
) {
  console.log(`🚀 Sending message to target: ${target.id} (Type: ${target.type || 'chat'}, Content: ${contentType})`);
  
  const client = await TeamsClient.create();
  return client.sendMessage(target, message, contentType);
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
      text: "🔔 Pull Request Notification",
      weight: "Bolder",
      size: "Small",
      color: "Accent",
      horizontalAlignment: "Center",
      wrap: true,
      spacing: "Small"
    },
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



 