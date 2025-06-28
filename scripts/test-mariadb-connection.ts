#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

// MariaDB connection configuration
const MARIADB_CONFIG = {
  host: '103.9.76.10',
  port: 3306,
  user: 'oyhumgag_sa',
  password: 'a%PnNf}(%QB_o+*R',
  database: 'oyhumgag_mstoolsuite',
  charset: 'utf8mb4',
  connectTimeout: 10000,
};

const testMariaDBConnection = async () => {
  console.log('🔗 Testing MariaDB connection...');
  console.log(`📍 Host: ${MARIADB_CONFIG.host}:${MARIADB_CONFIG.port}`);
  console.log(`👤 User: ${MARIADB_CONFIG.user}`);
  console.log(`🗄️ Database: ${MARIADB_CONFIG.database}`);

  try {
    // Test connection
    const connection = await mysql.createConnection(MARIADB_CONFIG);
    console.log('✅ Connected to MariaDB successfully!');

    // Test basic query (MariaDB compatible)
    const [result] = await connection.execute('SELECT VERSION() as version, NOW() as now_time, USER() as user_name');
    console.log('📊 Database info:', (result as any[])[0]);

    // Check target database exists
    const [databases] = await connection.execute(`SHOW DATABASES LIKE '${MARIADB_CONFIG.database}'`);
    if ((databases as any[]).length > 0) {
      console.log('✅ Target database exists');
    } else {
      console.log('❌ Target database does not exist');
      console.log('🔧 Creating database...');
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${MARIADB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Database created');
    }

    // Switch to target database
    await connection.execute(`USE \`${MARIADB_CONFIG.database}\``);

    // Check existing tables
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [MARIADB_CONFIG.database]);

    console.log('\n📋 Existing tables:');
    if ((tables as any[]).length === 0) {
      console.log('  📝 No tables found (database is empty)');
    } else {
      (tables as any[]).forEach(table => {
        console.log(`  📊 ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} rows)`);
      });
    }

    // Test write permissions
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_connection (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_text VARCHAR(255),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      await connection.execute(`
        INSERT INTO test_connection (test_text) VALUES (?)
      `, ['MariaDB migration test']);

      const [testResult] = await connection.execute('SELECT * FROM test_connection ORDER BY id DESC LIMIT 1');
      console.log('✅ Write permissions: OK');
      console.log('📝 Test record:', (testResult as any[])[0]);

      // Cleanup test table
      await connection.execute('DROP TABLE test_connection');
      console.log('🧹 Test table cleaned up');

    } catch (writeError) {
      console.log('❌ Write permissions: FAILED');
      console.error('Write error:', writeError);
    }

    // Test JSON support (MariaDB 10.2+)
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS test_json (
          id INT AUTO_INCREMENT PRIMARY KEY,
          data JSON,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      await connection.execute(`
        INSERT INTO test_json (data) VALUES (?)
      `, [JSON.stringify({ test: true, migration: 'ready' })]);

      const [jsonResult] = await connection.execute('SELECT * FROM test_json ORDER BY id DESC LIMIT 1');
      console.log('✅ JSON support: OK');
      console.log('📝 JSON test:', (jsonResult as any[])[0]);

      // Cleanup
      await connection.execute('DROP TABLE test_json');
      console.log('🧹 JSON test table cleaned up');

    } catch (jsonError) {
      console.log('⚠️ JSON support: Limited or not available');
      console.log('💡 Will use TEXT columns for JSON data');
    }

    await connection.end();
    console.log('\n🎉 MariaDB connection test completed successfully!');
    
    // Print connection string for .env
    const encodedPassword = encodeURIComponent(MARIADB_CONFIG.password);
    const connectionString = `mysql://${MARIADB_CONFIG.user}:${encodedPassword}@${MARIADB_CONFIG.host}:${MARIADB_CONFIG.port}/${MARIADB_CONFIG.database}`;
    
    console.log('\n📋 Connection string for .env.local:');
    console.log(`DATABASE_URL="${connectionString}"`);

    console.log('\n✅ Ready for migration!');
    console.log('📋 Next steps:');
    console.log('1. 🚀 Run: npm run db:setup-mysql (will work with MariaDB)');
    console.log('2. 📥 Run: npm run import:mysql');
    console.log('3. 🧪 Run: npm run test:mysql');

  } catch (error) {
    console.error('❌ MariaDB connection failed:', error);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check MariaDB server version (need 10.2+ for JSON)');
    console.log('2. Verify database user permissions');
    console.log('3. Confirm database exists');
    console.log('4. Check character set support');
    
    process.exit(1);
  }
};

const main = async () => {
  try {
    await testMariaDBConnection();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { testMariaDBConnection }; 