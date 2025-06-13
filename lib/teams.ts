import { Client } from '@microsoft/microsoft-graph-client';
import { getValidAuthToken, saveAuthToken, getRefreshToken } from './auth';

// Teams OAuth configuration
const TEAMS_CONFIG = {
  clientId: process.env.TEAMS_CLIENT_ID!,
  clientSecret: process.env.TEAMS_CLIENT_SECRET!,
  tenantId: process.env.TEAMS_TENANT_ID!,
  scopes: [
    'https://graph.microsoft.com/Chat.ReadWrite',
    'https://graph.microsoft.com/TeamMember.Read.All',
    'https://graph.microsoft.com/User.Read',
  ],
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/auth/teams/callback`
    : `http://localhost:3000/api/auth/teams/callback`,
};

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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`https://login.microsoftonline.com/${TEAMS_CONFIG.tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: TEAMS_CONFIG.clientId,
      client_secret: TEAMS_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

// Get authenticated Graph API client with timeout
export async function getGraphClient(): Promise<Client> {
  console.log('🔍 Creating Graph API client...');
  
  try {
    // Add timeout for token operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Graph client creation timeout')), 10000); // 10 second timeout
    });
    
    const clientPromise = (async () => {
      console.log('🎯 Getting valid auth token (with auto-refresh)...');
      const accessToken = await getValidAuthToken();
      
      if (!accessToken) {
        console.error('❌ No valid token available after refresh attempt');
        throw new Error('Authentication required - please re-authorize with Teams');
      }

      console.log('✅ Valid token obtained');
      console.log('🔧 Initializing Graph client...');
      return Client.init({
        authProvider: async () => accessToken,
      });
    })();
    
    return await Promise.race([clientPromise, timeoutPromise]) as Client;
  } catch (error) {
    console.error('❌ Failed to create Graph client:', error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Authentication service is taking too long to respond. Please try again.');
    }
    
    throw error;
  }
}

// Simple in-memory cache for Teams chats
interface ChatCache {
  data: any[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

let teamsChatsCache: ChatCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Get cached chats if still valid
function getCachedChats(): any[] | null {
  if (!teamsChatsCache) {
    return null;
  }
  
  const now = Date.now();
  const isExpired = (now - teamsChatsCache.timestamp) > teamsChatsCache.ttl;
  
  if (isExpired) {
    console.log('📦 Cache expired, clearing...');
    teamsChatsCache = null;
    return null;
  }
  
  console.log('📦 Using cached chats data');
  return teamsChatsCache.data;
}

// Set cache with current data
function setCacheChats(data: any[]): void {
  teamsChatsCache = {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  };
  console.log(`📦 Cached ${data.length} chats for ${CACHE_TTL / 1000}s`);
}

// Get user's Teams chats with cache and optimization
export async function getUserChatsOptimized(useCache: boolean = true): Promise<any[]> {
  console.log('🔍 Getting user Teams chats (optimized + cached)...');
  
  // Check cache first if enabled
  if (useCache) {
    const cachedData = getCachedChats();
    if (cachedData) {
      return cachedData;
    }
  }
  
  try {
    // Use retry mechanism for better reliability
    const chats = await getUserChatsWithRetry(2);
    
    // Cache the results
    if (useCache) {
      setCacheChats(chats);
    }
    
    return chats;
  } catch (error) {
    console.error('❌ Failed to get optimized chats:', error);
    throw error;
  }
}

// Clear cache manually (useful for testing or refresh)
export function clearTeamsChatsCache(): void {
  teamsChatsCache = null;
  console.log('📦 Teams chats cache cleared');
}

// Get user's Teams chats with retry mechanism
export async function getUserChatsWithRetry(maxRetries: number = 2): Promise<any[]> {
  console.log(`🔄 Getting Teams chats with retry (max: ${maxRetries})`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${maxRetries}`);
      const chats = await getUserChats();
      console.log(`✅ Success on attempt ${attempt}`);
      return chats;
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : 'Unknown error');
      
      if (attempt === maxRetries) {
        // Last attempt failed, throw the error
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Get user's Teams chats with optimization and timeout
export async function getUserChats() {
  console.log('🔍 Getting user Teams chats (optimized)...');
  
  try {
    // Add timeout to prevent long-running requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Teams chats fetch timeout')), 15000); // Reduced to 15 seconds
    });
    
    const chatsPromise = (async () => {
      console.log('📊 Creating Graph API client...');
      const client = await getGraphClient();
      
      console.log('📋 Fetching chats from Graph API with optimization...');
      
      // Optimize query with:
      // 1. Select only needed fields to reduce payload
      // 2. Top 50 to limit results for faster response
      // 3. Filter for recent chats (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Đơn giản hóa query - chỉ lấy 3 chats với fields tối thiểu
      const chats = await client
        .api('/me/chats')
        .select('id,topic,chatType')
        .top(3)
        .get();
      
      console.log(`✅ Successfully fetched ${chats.value?.length || 0} chats (optimized)`);
      
      // Process results with better display names
      return chats.value.map((chat: any) => {
        let displayName = chat.topic;
        
        // If no topic, create a meaningful name based on chat type
        if (!displayName) {
          switch (chat.chatType) {
            case 'oneOnOne':
              displayName = '1:1 Chat';
              break;
            case 'group':
              displayName = `Group Chat (${chat.members?.length || 'N/A'} members)`;
              break;
            case 'meeting':
              displayName = 'Meeting Chat';
              break;
            default:
              displayName = `${chat.chatType} Chat`;
          }
        }
        
        return {
          id: chat.id,
          displayName,
          chatType: chat.chatType,
          lastUpdated: chat.lastUpdatedDateTime,
        };
      });
    })();
    
    return await Promise.race([chatsPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Failed to get user chats:', error);
    
    // Enhanced error handling with specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('Teams API is taking too long to respond. Please try again.');
      }
      
      if (error.message.includes('Forbidden') || error.message.includes('403')) {
        throw new Error('Access denied. Please check your Teams permissions and re-authenticate.');
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        throw new Error('Authentication expired. Please re-connect to Teams.');
      }
      
      if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
    }
    
    throw new Error('Failed to fetch Teams chats. Please check your connection and try again.');
  }
}

// Send message to Teams chat with timeout (supports both text and Adaptive Cards)
export async function sendMessageToChat(
  chatId: string,
  message: string | any,
  contentType: 'text' | 'html' | 'adaptiveCard' = 'html'
): Promise<string> {
  console.log(`📤 Sending message to chat: ${chatId}`);
  
  try {
    // Add timeout to prevent long-running requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Send message timeout')), 15000); // 15 second timeout
    });
    
    const sendPromise = (async () => {
      console.log('📊 Creating Graph API client for sending message...');
      const client = await getGraphClient();
      
      console.log('📨 Posting message to Teams chat...');
      
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
      
      const result = await client.api(`/chats/${chatId}/messages`).post(messagePayload);
      
      console.log('✅ Message sent successfully, ID:', result.id);
      return result.id;
    })();
    
    return await Promise.race([sendPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Failed to send message to chat:', error);
    
    // Return friendly error message based on error type
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error('Teams API is taking too long to send message. The message may still be delivered.');
    }
    
    throw new Error('Failed to send message to Teams chat. Please check your permissions and try again.');
  }
}

// Format pull request message for Teams using Adaptive Cards
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
  const { title, author, sourceBranch, targetBranch, url, description, mentions } = prData;
  
  // Create improved Adaptive Card (English)
  const adaptiveCard = {
    contentType: "application/vnd.microsoft.card.adaptive",
    content: {
      type: "AdaptiveCard",
      version: "1.3",
      body: [
        {
          type: "TextBlock",
          text: "🔔 Pull Request Notification",
          weight: "Bolder",
          size: "Medium",
          color: "Accent",
          spacing: "None"
        },
        {
          type: "TextBlock",
          text: title,
          weight: "Bolder",
          size: "Large",
          wrap: true,
          spacing: "Small"
        },
        {
          type: "FactSet",
          facts: [
            {
              title: "Author",
              value: author
            },
            {
              title: "Branch",
              value: `${sourceBranch} → ${targetBranch}`
            }
          ]
        },
        ...(description ? [{
          type: "TextBlock",
          text: description,
          wrap: true,
          spacing: "Medium",
          color: "Good",
          isSubtle: false,
          italic: true
        }] : []),
        {
          type: "TextBlock",
          text: "Please review this pull request and provide your feedback.",
          wrap: true,
          spacing: "Medium",
          isSubtle: true
        }
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View Pull Request",
          url: url
        }
      ]
    }
  };

  // Add mentions if provided
  if (mentions && mentions.length > 0) {
    const mentionText = mentions.map(user => `<at>${user}</at>`).join(' ');
    (adaptiveCard.content.body as any[]).push({
      type: "TextBlock",
      text: `${mentionText} - Your review is requested!`,
      wrap: true,
      spacing: "Medium",
      weight: "Bolder"
    });
  }

  return adaptiveCard;
}

// Fallback HTML message format
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
  const { title, author, sourceBranch, targetBranch, url, description, mentions } = prData;
  
  let message = `
    <div>
      <h3><strong>New Pull Request</strong></h3>
      <p><strong>${title}</strong></p>
      <p><strong>Author:</strong> ${author}</p>
      <p><strong>Branch:</strong> ${sourceBranch} → ${targetBranch}</p>
      ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
      <p>Please review this pull request and provide your feedback.</p>
      <p><a href="${url}">View Pull Request</a></p>
    </div>
  `;

  // Add mentions if provided
  if (mentions && mentions.length > 0) {
    const mentionText = mentions.map(user => `<at>${user}</at>`).join(' ');
    message += `<p><strong>${mentionText} - Your review is requested!</strong></p>`;
  }

  return message;
}

// Check Teams authentication status
export async function checkTeamsAuthStatus(): Promise<{
  isAuthenticated: boolean;
  userInfo?: any;
  error?: string;
}> {
  try {
    console.log('🔍 Checking Teams auth status...');
    
    // First check if we have a valid token in database
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
        displayName: 'User',
        email: 'Authenticated',
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

// Check Teams authentication status with Graph API validation (slower)
export async function checkTeamsAuthStatusDetailed(): Promise<{
  isAuthenticated: boolean;
  userInfo?: any;
  error?: string;
}> {
  try {
    console.log('🔍 Checking Teams auth status with Graph API validation...');
    
    // First check if we have a valid token in database
    const token = await getValidAuthToken();
    console.log('🎯 Valid token from DB:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ No valid token found in database');
      return {
        isAuthenticated: false,
        error: 'No valid authentication token found',
      };
    }
    
    console.log('✅ Token found, testing Graph API access...');
    
    // Add timeout to Graph API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Graph API call timeout')), 10000); // 10 second timeout
    });
    
    const graphApiPromise = (async () => {
      const client = await getGraphClient();
      return await client.api('/me').get();
    })();
    
    const userInfo = await Promise.race([graphApiPromise, timeoutPromise]);
    
    console.log('✅ Graph API access successful');
    return {
      isAuthenticated: true,
      userInfo: {
        displayName: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName,
        id: userInfo.id,
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