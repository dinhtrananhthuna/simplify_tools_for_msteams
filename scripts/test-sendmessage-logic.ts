// Test the sendMessage logic without actual API calls
const readline = require('readline');

// Mock TeamsClient for testing
class MockTeamsClient {
  constructor(private accessToken: string) {}
  
  async makeRequest(endpoint: string, options: any = {}) {
    console.log(`🔌 Mock API Call: ${options.method || 'GET'} ${endpoint}`);
    
    if (endpoint.includes('/teams/') && endpoint.includes('/channels/')) {
      // Simulate channel message success
      return { id: 'channel-message-' + Date.now() };
    } else if (endpoint.includes('/chats/')) {
      // Simulate chat message failure for invalid thread ID
      throw new Error('404 Not Found - {"error":{"code":"NotFound","message":"NotFound","innerError":{"code":"1","message":"Invalid ThreadId."}}}');
    } else if (endpoint === '/me/joinedTeams?$select=id,displayName') {
      // Return mock teams
      return {
        value: [
          { id: 'team1', displayName: 'Simplify Project' },
          { id: 'team2', displayName: 'Development Team' }
        ]
      };
    } else if (endpoint === '/teams/team1/channels') {
      // Return channels list for team1 with our target conversation ID
      return {
        value: [
          { id: '19:281501b700be4da1b8dc8a900428860e@thread.v2', displayName: 'General' },
          { id: '19:another_channel_id@thread.v2', displayName: 'Development' }
        ]
      };
    } else if (endpoint === '/teams/team2/channels') {
      // Return channels list for team2 without our target conversation ID
      return {
        value: [
          { id: '19:different_channel_id@thread.v2', displayName: 'Team2 General' }
        ]
      };
    } else if (endpoint.includes('/teams/') && endpoint.includes('/channels/')) {
      // Handle individual channel requests (should not be used in new logic)
      throw new Error('404 Not Found - Individual channel endpoint not used');
    }
    
    return null;
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
      body = {
        body: {
          contentType: contentType,
          content: message,
        },
      };
    } else {
      // This is a 1-on-1 or group chat
      endpoint = `/chats/${target.id}/messages`;
      body = {
        body: {
          contentType: contentType,
          content: message,
        },
      };
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
      return response?.id || 'mock-message-id';
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

async function testSendMessageLogic() {
  console.log('🧪 Testing SendMessage Logic with Mock Data\n');
  
  const client = new MockTeamsClient('mock-token');
  
  // Test case 1: Sending to problematic chat ID (should auto-detect as channel)
  console.log('='.repeat(60));
  console.log('Test 1: Sending to chat ID that is actually a channel');
  console.log('='.repeat(60));
  
  const problemChatId = '19:281501b700be4da1b8dc8a900428860e@thread.v2';
  const target1 = { id: problemChatId, type: 'group' }; // Wrong type
  
  try {
    await client.sendMessage(target1, 'Test message', 'text');
  } catch (error) {
    console.log('Final error:', error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Test 2: Sending to correct channel target');
  console.log('='.repeat(60));
  
  // Test case 2: Sending with correct channel info
  const target2 = { 
    id: problemChatId, 
    type: 'channel', 
    teamId: 'team1' 
  };
  
  try {
    const result = await client.sendMessage(target2, 'Test message', 'text');
    console.log('✅ Success with correct channel target:', result);
  } catch (error) {
    console.log('❌ Failed even with correct target:', error);
  }
}

testSendMessageLogic().catch(console.error); 