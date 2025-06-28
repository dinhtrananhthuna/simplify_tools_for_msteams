#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔗 Connecting to PostgreSQL database...');

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface ExportedData {
  auth_tokens: any[];
  tools: any[];
  webhook_logs: any[];
  tool_settings: any[];
}

const exportData = async (): Promise<ExportedData> => {
  console.log('📊 Exporting data from PostgreSQL...');

  try {
    // Export auth_tokens
    const authTokensResult = await pool.query('SELECT * FROM auth_tokens ORDER BY id');
    console.log(`✅ Exported ${authTokensResult.rows.length} auth tokens`);

    // Export tools
    const toolsResult = await pool.query('SELECT * FROM tools ORDER BY id');
    console.log(`✅ Exported ${toolsResult.rows.length} tools`);

    // Export webhook_logs
    const webhookLogsResult = await pool.query('SELECT * FROM webhook_logs ORDER BY id');
    console.log(`✅ Exported ${webhookLogsResult.rows.length} webhook logs`);

    // Export tool_settings
    const toolSettingsResult = await pool.query('SELECT * FROM tool_settings ORDER BY key');
    console.log(`✅ Exported ${toolSettingsResult.rows.length} tool settings`);

    return {
      auth_tokens: authTokensResult.rows,
      tools: toolsResult.rows,
      webhook_logs: webhookLogsResult.rows,
      tool_settings: toolSettingsResult.rows,
    };

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
};

const convertPostgresToMysqlData = (data: ExportedData): ExportedData => {
  console.log('🔄 Converting PostgreSQL data to MySQL format...');

  // Convert timestamps to MySQL DATETIME format
  const convertTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    return new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
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
    config: typeof tool.config === 'object' ? JSON.stringify(tool.config) : tool.config,
    permissions_granted: tool.permissions_granted ? JSON.stringify(tool.permissions_granted) : null,
    created_at: convertTimestamp(tool.created_at),
    updated_at: convertTimestamp(tool.updated_at),
  }));

  // Convert webhook_logs
  const convertedWebhookLogs = data.webhook_logs.map(log => ({
    ...log,
    payload: log.payload ? JSON.stringify(log.payload) : null,
    user_context: log.user_context ? JSON.stringify(log.user_context) : null,
    processed_at: convertTimestamp(log.processed_at),
    created_at: convertTimestamp(log.created_at),
  }));

  // Convert tool_settings
  const convertedToolSettings = data.tool_settings.map(setting => ({
    ...setting,
    value: typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value,
    updated_at: convertTimestamp(setting.updated_at),
  }));

  console.log('✅ Data conversion completed');

  return {
    auth_tokens: convertedAuthTokens,
    tools: convertedTools,
    webhook_logs: convertedWebhookLogs,
    tool_settings: convertedToolSettings,
  };
};

const main = async () => {
  try {
    const data = await exportData();
    const convertedData = convertPostgresToMysqlData(data);

    // Save to JSON file
    const exportPath = resolve(process.cwd(), 'scripts/postgres-export.json');
    writeFileSync(exportPath, JSON.stringify(convertedData, null, 2));

    console.log('🎉 Export completed successfully!');
    console.log(`📁 Data saved to: ${exportPath}`);
    console.log('📋 Summary:');
    console.log(`   - ${convertedData.auth_tokens.length} auth tokens`);
    console.log(`   - ${convertedData.tools.length} tools`);
    console.log(`   - ${convertedData.webhook_logs.length} webhook logs`);
    console.log(`   - ${convertedData.tool_settings.length} tool settings`);

  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { exportData, convertPostgresToMysqlData }; 