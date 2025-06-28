#!/usr/bin/env tsx

import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

let DB_URL = process.env.DATABASE_URL;

// Fallback to MariaDB config for migration
if (!DB_URL) {
  console.log('⚠️ DATABASE_URL not found in environment, using MariaDB migration config');
  DB_URL = 'mysql://oyhumgag_sa:a%25PnNf%7D%28%25QB_o%2B%2AR@103.9.76.10:3306/oyhumgag_mstoolsuite';
}

console.log('🔗 Connecting to MySQL database...');

// Parse MySQL connection URL
const createConnection = async () => {
  try {
    // Use object config for better reliability
    const connection = await mysql.createConnection({
      host: '103.9.76.10',
      port: 3306,
      user: 'oyhumgag_sa',
      password: 'a%PnNf}(%QB_o+*R',
      database: 'oyhumgag_mstoolsuite',
      charset: 'utf8mb4',
      connectTimeout: 15000
    });
    console.log('✅ Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error);
    process.exit(1);
  }
};

interface ExportedData {
  auth_tokens: any[];
  tools: any[];
  webhook_logs: any[];
  tool_settings: any[];
}

const loadExportedData = (): ExportedData => {
  const exportPath = resolve(process.cwd(), 'scripts/postgres-export-for-mysql.json');
  
  if (!existsSync(exportPath)) {
    console.error('❌ Export file not found:', exportPath);
    console.error('📝 Please run: npm run export:postgres first');
    process.exit(1);
  }

  try {
    const fileContent = readFileSync(exportPath, 'utf-8');
    const data = JSON.parse(fileContent);
    console.log('✅ Loaded exported data from:', exportPath);
    return data;
  } catch (error) {
    console.error('❌ Failed to load export file:', error);
    process.exit(1);
  }
};

const importData = async (data: ExportedData) => {
  console.log('📊 Importing data to MySQL...');
  
  const connection = await createConnection();

  try {
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Import auth_tokens
    if (data.auth_tokens.length > 0) {
      console.log(`📥 Importing ${data.auth_tokens.length} auth tokens...`);
      
      for (const token of data.auth_tokens) {
        await connection.execute(`
          INSERT INTO auth_tokens (user_id, access_token, refresh_token, expires_at, scope, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            expires_at = VALUES(expires_at),
            scope = VALUES(scope),
            updated_at = VALUES(updated_at)
        `, [
          token.user_id,
          token.access_token,
          token.refresh_token,
          token.expires_at,
          token.scope,
          token.created_at,
          token.updated_at
        ]);
      }
      console.log('✅ Auth tokens imported');
    }

    // Import tools
    if (data.tools.length > 0) {
      console.log(`📥 Importing ${data.tools.length} tools...`);
      
      for (const tool of data.tools) {
        await connection.execute(`
          INSERT INTO tools (id, name, description, icon, category, config, is_active, permissions_granted, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            icon = VALUES(icon),
            category = VALUES(category),
            config = VALUES(config),
            is_active = VALUES(is_active),
            permissions_granted = VALUES(permissions_granted),
            updated_at = VALUES(updated_at)
        `, [
          tool.id,
          tool.name,
          tool.description,
          tool.icon || '🛠️',
          tool.category,
          tool.config,
          tool.is_active,
          tool.permissions_granted,
          tool.created_at,
          tool.updated_at
        ]);
      }
      console.log('✅ Tools imported');
    }

    // Import webhook_logs
    if (data.webhook_logs.length > 0) {
      console.log(`📥 Importing ${data.webhook_logs.length} webhook logs...`);
      
      for (const log of data.webhook_logs) {
        await connection.execute(`
          INSERT INTO webhook_logs (tool_id, webhook_source, event_type, payload, processed_at, status, error_message, teams_message_id, user_context, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          log.tool_id,
          log.webhook_source,
          log.event_type,
          log.payload,
          log.processed_at,
          log.status,
          log.error_message,
          log.teams_message_id,
          log.user_context,
          log.created_at
        ]);
      }
      console.log('✅ Webhook logs imported');
    }

    // Import tool_settings
    if (data.tool_settings.length > 0) {
      console.log(`📥 Importing ${data.tool_settings.length} tool settings...`);
      
      for (const setting of data.tool_settings) {
        await connection.execute(`
          INSERT INTO tool_settings (\`key\`, value, description, updated_at)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            value = VALUES(value),
            description = VALUES(description),
            updated_at = VALUES(updated_at)
        `, [
          setting.key,
          setting.value,
          setting.description,
          setting.updated_at
        ]);
      }
      console.log('✅ Tool settings imported');
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 Data import completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

const main = async () => {
  try {
    const data = loadExportedData();
    await importData(data);

    console.log('📋 Import Summary:');
    console.log(`   - ${data.auth_tokens.length} auth tokens imported`);
    console.log(`   - ${data.tools.length} tools imported`);
    console.log(`   - ${data.webhook_logs.length} webhook logs imported`);
    console.log(`   - ${data.tool_settings.length} tool settings imported`);
    console.log('✅ Migration to MySQL completed!');

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { importData }; 