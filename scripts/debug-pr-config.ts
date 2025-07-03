import { executeQuery } from '../lib/db';

async function debugPRConfig() {
  try {
    console.log('🔍 Checking PR Notifier configuration...');
    
    // Get PR Notifier config
    const tools = await executeQuery<{ id: string; name: string; config: any; is_active: boolean }>(
      'SELECT id, name, config, is_active FROM tools WHERE id = ?',
      ['pr-notifier']
    );

    if (tools.length === 0) {
      console.log('❌ PR Notifier not found in database');
      return;
    }

    const tool = tools[0];
    console.log('✅ Found PR Notifier tool:');
    console.log('- ID:', tool.id);
    console.log('- Name:', tool.name);
    console.log('- Active:', tool.is_active);
    
    try {
      const config = typeof tool.config === 'string' ? JSON.parse(tool.config) : tool.config;
      console.log('- Config:');
      console.log('  * Azure DevOps URL:', config.azureDevOpsUrl);
      console.log('  * Target Chat ID:', config.targetChatId);
      console.log('  * Enable Mentions:', config.enableMentions);
      console.log('  * Mention Users:', config.mentionUsers);
      
      // Validate Chat ID format
      if (config.targetChatId) {
        const chatId = config.targetChatId;
        console.log('\n🔍 Analyzing Chat ID:');
        console.log('- Chat ID:', chatId);
        console.log('- Length:', chatId.length);
        console.log('- Format:', chatId.includes('@') ? 'Seems valid (contains @)' : 'May be invalid (no @)');
        
        // Teams Chat ID thường có format: 19:xxx@thread.v2 hoặc 19:xxx@thread.skype
        if (!chatId.startsWith('19:') || (!chatId.includes('@thread.v2') && !chatId.includes('@thread.skype'))) {
          console.log('⚠️  WARNING: Chat ID format may be invalid!');
          console.log('   Expected format: 19:xxx@thread.v2 or 19:xxx@thread.skype');
        } else {
          console.log('✅ Chat ID format looks valid');
        }
      } else {
        console.log('❌ No target chat ID configured!');
      }
      
    } catch (parseError) {
      console.log('❌ Failed to parse config:', parseError);
      console.log('Raw config:', tool.config);
    }

    // Check recent webhook logs
    console.log('\n📋 Recent webhook logs:');
    const logs = await executeQuery<{
      id: number;
      event_type: string;
      status: string;
      error_message: string;
      created_at: string;
    }>(
      `SELECT id, event_type, status, error_message, created_at 
       FROM webhook_logs 
       WHERE tool_id = 'pr-notifier' 
       ORDER BY created_at DESC 
       LIMIT 5`
    );

    if (logs.length === 0) {
      console.log('No recent webhook logs found');
    } else {
      logs.forEach(log => {
        console.log(`- ${log.created_at}: ${log.event_type} - ${log.status}`);
        if (log.error_message) {
          console.log(`  Error: ${log.error_message}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

debugPRConfig(); 