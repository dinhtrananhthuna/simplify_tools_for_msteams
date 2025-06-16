#!/usr/bin/env tsx

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const addQuickbugTool = async () => {
  console.log('🔧 Adding Quickbug tool to database...');

  try {
    // Insert Quickbug tool
    const result = await pool.query(`
      INSERT INTO tools (
        id, 
        name, 
        description, 
        icon, 
        category, 
        is_active, 
        config,
        created_at,
        updated_at
      )
      VALUES (
        'quickbug',
        'Quick Bug Reporter', 
        'Teams Message Extension để báo cáo bug nhanh với Adaptive Cards',
        '🐞',
        'productivity',
        true,
        '{"defaultEnvironment": "Production", "severityLevels": ["Critical", "High", "Medium", "Low"]}',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        category = EXCLUDED.category,
        is_active = EXCLUDED.is_active,
        config = EXCLUDED.config,
        updated_at = NOW()
      RETURNING id, name;
    `);

    if (result.rows.length > 0) {
      const tool = result.rows[0];
      console.log(`✅ Added/Updated tool: ${tool.name} (${tool.id})`);
    }

    // Verify tool was added
    const verification = await pool.query(`
      SELECT id, name, description, icon, category, is_active, config
      FROM tools 
      WHERE id = 'quickbug'
    `);

    if (verification.rows.length > 0) {
      const tool = verification.rows[0];
      console.log('📋 Tool details:');
      console.log(`   - ID: ${tool.id}`);
      console.log(`   - Name: ${tool.name}`);
      console.log(`   - Description: ${tool.description}`);
      console.log(`   - Icon: ${tool.icon}`);
      console.log(`   - Category: ${tool.category}`);
      console.log(`   - Active: ${tool.is_active}`);
      console.log(`   - Config: ${JSON.stringify(tool.config, null, 2)}`);
    }

    console.log('✅ Quickbug tool migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migration
addQuickbugTool().catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
}); 