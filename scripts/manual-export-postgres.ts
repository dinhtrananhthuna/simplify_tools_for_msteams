#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// Load environment variables - using current PostgreSQL connection
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('📝 Make sure you have PostgreSQL DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to PostgreSQL (current database)...');

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface ExportedData {
  auth_tokens: any[];
  tools: any[];
  webhook_logs: any[];
  tool_settings: any[];
  export_info: {
    exported_at: string;
    source: string;
    converted_at?: string;
    format?: string;
    record_counts: {
      auth_tokens: number;
      tools: number;
      webhook_logs: number;
      tool_settings: number;
    };
  };
}

const exportAllData = async (): Promise<ExportedData> => {
  console.log('📊 Exporting all data from PostgreSQL...');

  try {
    // Test connection first
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');

    // Export auth_tokens
    console.log('📝 Exporting auth_tokens...');
    const authTokensResult = await pool.query('SELECT * FROM auth_tokens ORDER BY id');
    console.log(`✅ Exported ${authTokensResult.rows.length} auth tokens`);

    // Export tools
    console.log('🛠️ Exporting tools...');
    const toolsResult = await pool.query('SELECT * FROM tools ORDER BY id');
    console.log(`✅ Exported ${toolsResult.rows.length} tools`);

    // Export webhook_logs
    console.log('📈 Exporting webhook_logs...');
    const webhookLogsResult = await pool.query('SELECT * FROM webhook_logs ORDER BY id');
    console.log(`✅ Exported ${webhookLogsResult.rows.length} webhook logs`);

    // Export tool_settings
    console.log('⚙️ Exporting tool_settings...');
    const toolSettingsResult = await pool.query('SELECT * FROM tool_settings ORDER BY key');
    console.log(`✅ Exported ${toolSettingsResult.rows.length} tool settings`);

    // Show data sample
    console.log('\n📋 Data Summary:');
    if (authTokensResult.rows.length > 0) {
      console.log('  🔐 Auth tokens: Contains encrypted Teams tokens');
    }
    
    if (toolsResult.rows.length > 0) {
      console.log('  🛠️ Tools:');
      toolsResult.rows.forEach(tool => {
        console.log(`    - ${tool.name} (${tool.is_active ? 'active' : 'inactive'})`);
      });
    }

    if (webhookLogsResult.rows.length > 0) {
      console.log(`  📈 Webhook logs: ${webhookLogsResult.rows.length} entries`);
      const sources = Array.from(new Set(webhookLogsResult.rows.map(log => log.webhook_source)));
      console.log(`    Sources: ${sources.join(', ')}`);
    }

    return {
      auth_tokens: authTokensResult.rows,
      tools: toolsResult.rows,
      webhook_logs: webhookLogsResult.rows,
      tool_settings: toolSettingsResult.rows,
      export_info: {
        exported_at: new Date().toISOString(),
        source: 'PostgreSQL (Neon)',
        record_counts: {
          auth_tokens: authTokensResult.rows.length,
          tools: toolsResult.rows.length,
          webhook_logs: webhookLogsResult.rows.length,
          tool_settings: toolSettingsResult.rows.length,
        }
      }
    };

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
};

const convertToMySQLFormat = (data: ExportedData): ExportedData => {
  console.log('\n🔄 Converting data to MySQL format...');

  // Convert timestamps to MySQL DATETIME format
  const convertTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    return new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
  };

  // Convert JSON objects to strings for MySQL JSON type
  const convertJSON = (obj: any) => {
    if (!obj) return null;
    return typeof obj === 'object' ? JSON.stringify(obj) : obj;
  };

  // Convert auth_tokens
  const convertedAuthTokens = data.auth_tokens.map(token => ({
    ...token,
    expires_at: convertTimestamp(token.expires_at),
    created_at: convertTimestamp(token.created_at),
    updated_at: convertTimestamp(token.updated_at),
  }));

  // Convert tools
  const convertedTools = data.tools.map(tool => ({
    ...tool,
    config: convertJSON(tool.config),
    permissions_granted: convertJSON(tool.permissions_granted),
    created_at: convertTimestamp(tool.created_at),
    updated_at: convertTimestamp(tool.updated_at),
  }));

  // Convert webhook_logs
  const convertedWebhookLogs = data.webhook_logs.map(log => ({
    ...log,
    payload: convertJSON(log.payload),
    user_context: convertJSON(log.user_context),
    processed_at: convertTimestamp(log.processed_at),
    created_at: convertTimestamp(log.created_at),
  }));

  // Convert tool_settings
  const convertedToolSettings = data.tool_settings.map(setting => ({
    ...setting,
    value: convertJSON(setting.value),
    updated_at: convertTimestamp(setting.updated_at),
  }));

  console.log('✅ Data conversion completed');

  return {
    auth_tokens: convertedAuthTokens,
    tools: convertedTools,
    webhook_logs: convertedWebhookLogs,
    tool_settings: convertedToolSettings,
    export_info: {
      ...data.export_info,
      converted_at: new Date().toISOString(),
      format: 'MySQL compatible'
    }
  };
};

const main = async () => {
  try {
    console.log('🚀 Starting PostgreSQL data export for MySQL migration...\n');
    
    const rawData = await exportAllData();
    const convertedData = convertToMySQLFormat(rawData);

    // Save to JSON file
    const exportPath = resolve(process.cwd(), 'scripts/postgres-export-for-mysql.json');
    writeFileSync(exportPath, JSON.stringify(convertedData, null, 2));

    console.log('\n🎉 Export completed successfully!');
    console.log(`📁 Data saved to: ${exportPath}`);
    console.log('\n📋 Export Summary:');
    console.log(`   📝 Auth tokens: ${convertedData.auth_tokens.length}`);
    console.log(`   🛠️ Tools: ${convertedData.tools.length}`);
    console.log(`   📈 Webhook logs: ${convertedData.webhook_logs.length}`);
    console.log(`   ⚙️ Tool settings: ${convertedData.tool_settings.length}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. ✅ Data exported and ready for MySQL');
    console.log('2. 🔧 Fix MySQL remote access issues');
    console.log('3. 🚀 Run: npm run db:setup-mysql');
    console.log('4. 📥 Run: npm run import:mysql');
    console.log('5. 🧪 Run: npm run test:mysql');

    // Create connection string template
    console.log('\n📋 MySQL connection string template:');
    console.log('DATABASE_URL="mysql://oyhumgag_sa:a%25PnNf%7D%28%25QB_o%2B%2AR@103.9.76.10:3306/oyhumgag_mstoolsuite"');

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { exportAllData, convertToMySQLFormat }; 