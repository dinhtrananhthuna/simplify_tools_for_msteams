#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'path';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('📝 Please create .env.local file with DATABASE_URL=your_neon_connection_string');
  process.exit(1);
}

console.log('🔗 Connecting to database...');

const pool = new Pool({
  connectionString: DB_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createTables = async () => {
  console.log('🚀 Setting up database tables...');

  try {
    // 1. Auth Tokens Table
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
    console.log('✅ auth_tokens table created');

    // 2. Tools Table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('automation', 'productivity', 'integration')),
        config JSONB NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT false,
        permissions_granted JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ tools table created');

    // 3. Webhook Logs Table
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
        user_context JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ webhook_logs table created');

    // 4. Tool Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ tool_settings table created');

    // Create Indexes
    console.log('📊 Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tools_active ON tools(is_active);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_tool_status ON webhook_logs(tool_id, status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON webhook_logs(created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_tool_created ON webhook_logs(tool_id, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_context ON webhook_logs USING GIN (user_context);
    `);

    console.log('✅ All indexes created');

    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add triggers for updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_auth_tokens_updated_at ON auth_tokens;
      CREATE TRIGGER update_auth_tokens_updated_at
        BEFORE UPDATE ON auth_tokens
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_tools_updated_at ON tools;
      CREATE TRIGGER update_tools_updated_at
        BEFORE UPDATE ON tools
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_tool_settings_updated_at ON tool_settings;
      CREATE TRIGGER update_tool_settings_updated_at
        BEFORE UPDATE ON tool_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Triggers created');

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await createTables();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { createTables }; 