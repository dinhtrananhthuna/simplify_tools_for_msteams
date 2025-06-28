#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

// MySQL connection info
const MYSQL_CONFIG = {
  host: '103.9.76.10',
  port: 3306,
  user: 'oyhumgag_sa',
  password: 'a%PnNf}(%QB_o+*R',
  database: 'oyhumgag_mstoolsuite',
  charset: 'utf8mb4',
  // SSL options for remote connection
  ssl: undefined, // Try without SSL first
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
};

const testConnection = async () => {
  console.log('🔗 Testing MySQL connection...');
  console.log(`📍 Host: ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);
  console.log(`👤 User: ${MYSQL_CONFIG.user}`);
  console.log(`🗄️ Database: ${MYSQL_CONFIG.database}`);

  try {
    // Test connection
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Connected to MySQL database successfully!');

    // Test basic query
    const [result] = await connection.execute('SELECT VERSION() as version, NOW() as current_time');
    console.log('📊 Database info:', (result as any[])[0]);

    // Check database exists
    const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [MYSQL_CONFIG.database]);
    if ((databases as any[]).length > 0) {
      console.log('✅ Target database exists');
    } else {
      console.log('❌ Target database does not exist');
    }

    // Check existing tables
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [MYSQL_CONFIG.database]);

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
        )
      `);
      
      await connection.execute(`
        INSERT INTO test_connection (test_text) VALUES (?)
      `, ['Migration test']);

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

    await connection.end();
    console.log('\n🎉 MySQL connection test completed successfully!');
    
    // Print connection string for .env
    const encodedPassword = encodeURIComponent(MYSQL_CONFIG.password);
    const connectionString = `mysql://${MYSQL_CONFIG.user}:${encodedPassword}@${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}/${MYSQL_CONFIG.database}`;
    
    console.log('\n📋 Connection string for .env.local:');
    console.log(`DATABASE_URL="${connectionString}"`);

  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check if MySQL server is running');
    console.log('2. Verify firewall allows port 3306');
    console.log('3. Check username/password are correct');
    console.log('4. Ensure remote connections are enabled');
    console.log('5. Try with SSL enabled if connection fails');
    
    process.exit(1);
  }
};

const main = async () => {
  try {
    await testConnection();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { testConnection }; 