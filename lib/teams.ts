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

// Get authenticated Graph API client
export async function getGraphClient(): Promise<Client> {
  let accessToken = await getValidAuthToken();
  
  if (!accessToken) {
    // Try to refresh token
    try {
      const tokens = await refreshAccessToken();
      await saveAuthToken(
        tokens.access_token,
        tokens.refresh_token,
        tokens.expires_in,
        TEAMS_CONFIG.scopes.join(' ')
      );
      accessToken = tokens.access_token;
    } catch (error) {
      throw new Error('Authentication required - please re-authorize with Teams');
    }
  }

  return Client.init({
    authProvider: async () => accessToken!,
  });
}

// Get user's Teams chats
export async function getUserChats() {
  const client = await getGraphClient();
  
  try {
    const chats = await client.api('/me/chats').get();
    return chats.value.map((chat: any) => ({
      id: chat.id,
      displayName: chat.topic || `Chat với ${chat.members?.length || 'N/A'} members`,
      chatType: chat.chatType,
      lastUpdated: chat.lastUpdatedDateTime,
    }));
  } catch (error) {
    console.error('Failed to get user chats:', error);
    throw new Error('Failed to fetch Teams chats');
  }
}

// Send message to Teams chat
export async function sendMessageToChat(
  chatId: string,
  message: string,
  contentType: 'text' | 'html' = 'html'
): Promise<string> {
  const client = await getGraphClient();
  
  try {
    const result = await client.api(`/chats/${chatId}/messages`).post({
      body: {
        content: message,
        contentType: contentType,
      },
    });
    
    return result.id;
  } catch (error) {
    console.error('Failed to send message to chat:', error);
    throw new Error('Failed to send message to Teams chat');
  }
}

// Format pull request message for Teams
export function formatPullRequestMessage(prData: {
  title: string;
  author: string;
  repository: string;
  sourceBranch: string;
  targetBranch: string;
  url: string;
  description?: string;
  mentions?: string[];
}): string {
  const { title, author, repository, sourceBranch, targetBranch, url, description, mentions } = prData;
  
  let message = `
    <div>
      <h3>🔔 New Pull Request</h3>
      <p><strong>${title}</strong></p>
      <p>👤 <strong>Author:</strong> ${author}</p>
      <p>📁 <strong>Repository:</strong> ${repository}</p>
      <p>🌿 <strong>Branch:</strong> ${sourceBranch} → ${targetBranch}</p>
      ${description ? `<p>📝 <strong>Description:</strong> ${description}</p>` : ''}
      <p>🔗 <a href="${url}">View Pull Request</a></p>
    </div>
  `;

  // Add mentions if provided
  if (mentions && mentions.length > 0) {
    const mentionText = mentions.map(user => `@${user}`).join(' ');
    message += `<p>👥 ${mentionText} - Please review!</p>`;
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
    const client = await getGraphClient();
    const userInfo = await client.api('/me').get();
    
    return {
      isAuthenticated: true,
      userInfo: {
        displayName: userInfo.displayName,
        email: userInfo.mail || userInfo.userPrincipalName,
        id: userInfo.id,
      },
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 