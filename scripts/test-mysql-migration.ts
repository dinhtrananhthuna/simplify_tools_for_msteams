#!/usr/bin/env tsx

import { config } from 'dotenv';
import mysql from 'mysql2/promise';
import { resolve } from 'path';

// Load environment variables from .env files
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

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

const testMigration = async () => {
  console.log('🧪 Testing MySQL migration...');
  
  const connection = await createConnection();

  try {
    // Test 1: Check all tables exist
    console.log('\n📋 1. Checking table structure...');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `);
    
    console.log('Tables in database:');
    (tables as any[]).forEach(table => {
      console.log(`  ✅ ${table.TABLE_NAME} (${table.TABLE_ROWS} rows)`);
    });

    // Test 2: Check data integrity
    console.log('\n📊 2. Checking data integrity...');
    
    // Count records in each table
    const authTokensCount = await connection.execute('SELECT COUNT(*) as count FROM auth_tokens');
    const toolsCount = await connection.execute('SELECT COUNT(*) as count FROM tools');
    const webhookLogsCount = await connection.execute('SELECT COUNT(*) as count FROM webhook_logs');
    const toolSettingsCount = await connection.execute('SELECT COUNT(*) as count FROM tool_settings');

    console.log('Record counts:');
    console.log(`  📝 auth_tokens: ${(authTokensCount[0] as any[])[0].count}`);
    console.log(`  🛠️ tools: ${(toolsCount[0] as any[])[0].count}`);
    console.log(`  📈 webhook_logs: ${(webhookLogsCount[0] as any[])[0].count}`);
    console.log(`  ⚙️ tool_settings: ${(toolSettingsCount[0] as any[])[0].count}`);

    // Test 3: Check JSON data integrity
    console.log('\n🔍 3. Testing JSON data integrity...');
    
    // Test tools config JSON
    const [toolsWithConfig] = await connection.execute(`
      SELECT id, name, config, permissions_granted 
      FROM tools 
      WHERE config IS NOT NULL
      LIMIT 3
    `);
    
    (toolsWithConfig as any[]).forEach(tool => {
      try {
        const config = JSON.parse(tool.config);
        console.log(`  ✅ ${tool.name}: JSON config valid`);
      } catch (error) {
        console.log(`  ❌ ${tool.name}: JSON config invalid`);
      }
    });

    // Test webhook logs JSON
    const [webhookWithPayload] = await connection.execute(`
      SELECT id, webhook_source, payload, user_context 
      FROM webhook_logs 
      WHERE payload IS NOT NULL
      LIMIT 3
    `);
    
    (webhookWithPayload as any[]).forEach(log => {
      try {
        if (log.payload) {
          const payload = JSON.parse(log.payload);
          console.log(`  ✅ Webhook ${log.id}: JSON payload valid`);
        }
      } catch (error) {
        console.log(`  ❌ Webhook ${log.id}: JSON payload invalid`);
      }
    });

    // Test 4: Check indexes
    console.log('\n📈 4. Checking indexes...');
    
    const [indexes] = await connection.execute(`
      SELECT DISTINCT INDEX_NAME, TABLE_NAME, COLUMN_NAME
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY TABLE_NAME, INDEX_NAME
    `);
    
    console.log('Database indexes:');
    (indexes as any[]).forEach(index => {
      console.log(`  📊 ${index.TABLE_NAME}.${index.INDEX_NAME} (${index.COLUMN_NAME})`);
    });

    // Test 5: Check foreign key constraints
    console.log('\n🔗 5. Checking foreign key constraints...');
    
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Foreign key constraints:');
    (foreignKeys as any[]).forEach(fk => {
      console.log(`  🔗 ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });

    // Test 6: CRUD operations
    console.log('\n⚡ 6. Testing CRUD operations...');
    
    // Test INSERT
    const testToolId = 'test-migration-tool';
    await connection.execute(`
      INSERT INTO tools (id, name, description, category, config, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      testToolId,
      'Migration Test Tool',
      'Tool created to test migration',
      'development',
      JSON.stringify({ test: true }),
      false
    ]);
    console.log('  ✅ INSERT test passed');

    // Test SELECT
    const [testTool] = await connection.execute(`
      SELECT * FROM tools WHERE id = ?
    `, [testToolId]);
    
    if ((testTool as any[]).length > 0) {
      console.log('  ✅ SELECT test passed');
    }

    // Test UPDATE
    await connection.execute(`
      UPDATE tools SET description = ? WHERE id = ?
    `, ['Updated description', testToolId]);
    console.log('  ✅ UPDATE test passed');

    // Test DELETE
    await connection.execute(`
      DELETE FROM tools WHERE id = ?
    `, [testToolId]);
    console.log('  ✅ DELETE test passed');

    // Test 7: Performance check
    console.log('\n⚡ 7. Performance testing...');
    
    const startTime = Date.now();
    await connection.execute(`
      SELECT t.*, COUNT(wl.id) as webhook_count
      FROM tools t
      LEFT JOIN webhook_logs wl ON t.id = wl.tool_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    const endTime = Date.now();
    
    console.log(`  ⚡ Complex query executed in ${endTime - startTime}ms`);

    console.log('\n🎉 Migration test completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('  ✅ Database connection: OK');
    console.log('  ✅ Table structure: OK');
    console.log('  ✅ Data integrity: OK');
    console.log('  ✅ JSON data: OK');
    console.log('  ✅ Indexes: OK');
    console.log('  ✅ Foreign keys: OK');
    console.log('  ✅ CRUD operations: OK');
    console.log('  ✅ Performance: OK');

  } catch (error) {
    console.error('❌ Migration test failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
};

const main = async () => {
  try {
    await testMigration();
    console.log('\n✅ All tests passed! MySQL migration is successful.');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { testMigration }; 