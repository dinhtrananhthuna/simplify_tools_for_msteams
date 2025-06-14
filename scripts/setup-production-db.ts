#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';

// Production database setup
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for production
});

const setupProductionDatabase = async () => {
  console.log('🚀 Setting up production database...');

  try {
    // Auth Tokens Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'admin',
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        scope TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);

    // Tools Table with icon column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '🛠️',
        category TEXT NOT NULL CHECK (category IN ('automation', 'productivity', 'integration', 'development')),
        config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT false,
        permissions_granted JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Webhook Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        tool_id TEXT REFERENCES tools(id) ON DELETE CASCADE,
        webhook_source TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload JSONB,
        processed_at TIMESTAMP,
        status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
        error_message TEXT,
        teams_message_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tool Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert PR Notifier tool if not exists
    await pool.query(`
      INSERT INTO tools (id, name, description, icon, category, is_active, config)
      VALUES (
        'pr-notifier',
        'Pull Request Notifier', 
        'Tự động thông báo team về pull requests mới từ Azure DevOps',
        '🔔',
        'development',
        false,
        '{}'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Production database setup completed successfully!');

  } catch (error) {
    console.error('❌ Production database setup failed:', error);
    throw error;
  }
};

setupProductionDatabase()
  .then(() => {
    console.log('🎉 Ready for production!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  }); 