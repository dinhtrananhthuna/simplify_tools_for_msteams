#!/usr/bin/env tsx

import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import { resolve } from 'path';

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
    // Use object config instead of connection string for better reliability
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

const createTables = async () => {
  console.log('🚀 Setting up MySQL database tables...');

  const connection = await createConnection();

  try {
    // 1. Auth Tokens Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'admin',
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        scope TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ auth_tokens table created');

    // 2. Tools Table  
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tools (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(10) DEFAULT '🛠️',
        category ENUM('automation', 'productivity', 'integration', 'development') NOT NULL,
        config JSON NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        permissions_granted JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ tools table created');

    // 3. Webhook Logs Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tool_id VARCHAR(255),
        webhook_source VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        payload JSON,
        processed_at DATETIME,
        status ENUM('success', 'failed') NOT NULL,
        error_message TEXT,
        teams_message_id VARCHAR(255),
        user_context JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ webhook_logs table created');

    // 4. Tool Settings Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tool_settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        value JSON NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ tool_settings table created');

    // Create Indexes
    console.log('📊 Creating indexes...');

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_tools_active ON tools(is_active);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_tool_status ON webhook_logs(tool_id, status);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_tool_created ON webhook_logs(tool_id, created_at DESC);
    `);

    console.log('✅ All indexes created');

    // Insert default PR Notifier tool if not exists
    await connection.execute(`
      INSERT IGNORE INTO tools (id, name, description, icon, category, is_active, config)
      VALUES (
        'pr-notifier',
        'Pull Request Notifier', 
        'Tự động thông báo team về pull requests mới từ Azure DevOps',
        '🔔',
        'development',
        false,
        '{}'
      );
    `);
    console.log('✅ Default PR Notifier tool created');

    console.log('🎉 MySQL database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

const main = async () => {
  try {
    await createTables();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { createTables }; 