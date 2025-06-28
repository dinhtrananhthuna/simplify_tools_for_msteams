#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

const connection = mysql.createConnection({
  host: '103.9.76.10',
  port: 3306,
  user: 'oyhumgag_sa',
  password: 'a%PnNf}(%QB_o+*R',
  database: 'oyhumgag_mstoolsuite',
  charset: 'utf8mb4',
  connectTimeout: 15000
});

async function debugPRNotifier() {
  console.log('🔍 Debugging PR Notifier configuration...');
  
  try {
    const conn = await connection;
    console.log('✅ Connected to MariaDB');

    // Check if tools table exists
    console.log('\n📋 Checking tools table...');
    const [tables] = await conn.execute('SHOW TABLES LIKE "tools"') as any[];
    console.log('Tools table exists:', Array.isArray(tables) && tables.length > 0);

    // Get all tools
    console.log('\n🔧 Getting all tools...');
    const [tools] = await conn.execute('SELECT id, name, is_active, config FROM tools') as any[];
    console.log('Total tools:', Array.isArray(tools) ? tools.length : 0);
    
    if (Array.isArray(tools) && tools.length > 0) {
      console.log('\n📊 Tools found:');
      for (const tool of tools) {
        console.log(`- ${tool.id}: ${tool.name} (active: ${tool.is_active})`);
        if (tool.id === 'pr-notifier') {
          console.log('  Config:', tool.config);
          try {
            const parsedConfig = JSON.parse(tool.config);
            console.log('  Parsed config:', parsedConfig);
          } catch (e: any) {
            console.log('  Config parse error:', e.message);
          }
        }
      }
    }

    // Specifically check pr-notifier
    console.log('\n🎯 Checking PR Notifier specifically...');
    const [prNotifier] = await conn.execute(
      'SELECT * FROM tools WHERE id = ?', 
      ['pr-notifier']
    ) as any[];
    
    if (Array.isArray(prNotifier) && prNotifier.length > 0) {
      console.log('✅ PR Notifier found in database:');
      const tool = prNotifier[0];
      console.log({
        id: tool.id,
        name: tool.name,
        is_active: tool.is_active,
        created_at: tool.created_at,
        updated_at: tool.updated_at,
        config: tool.config
      });
      
      // Try to parse config
      try {
        const config = JSON.parse(tool.config);
        console.log('\n📝 Parsed Configuration:');
        console.log('- Azure DevOps URL:', config.azureDevOpsUrl || 'NOT SET');
        console.log('- Target Chat ID:', config.targetChatId || 'NOT SET');
        console.log('- Enable Mentions:', config.enableMentions || false);
        console.log('- Mention Users:', config.mentionUsers || []);
      } catch (e: any) {
        console.log('❌ Config parsing failed:', e.message);
      }
    } else {
      console.log('❌ PR Notifier NOT found in database');
    }

    await conn.end();
    console.log('\n✅ Debug complete');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugPRNotifier(); 