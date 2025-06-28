#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

// Multiple configurations to try
const MYSQL_CONFIGS = [
  {
    name: 'Default config',
    config: {
      host: '103.9.76.10',
      port: 3306,
      user: 'oyhumgag_sa',
      password: 'a%PnNf}(%QB_o+*R',
      database: 'oyhumgag_mstoolsuite',
      charset: 'utf8mb4',
      connectTimeout: 10000,
    }
  },
  {
    name: 'With SSL enabled',
    config: {
      host: '103.9.76.10',
      port: 3306,
      user: 'oyhumgag_sa',
      password: 'a%PnNf}(%QB_o+*R',
      database: 'oyhumgag_mstoolsuite',
      charset: 'utf8mb4',
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000,
    }
  },
  {
    name: 'Without specific database',
    config: {
      host: '103.9.76.10',
      port: 3306,
      user: 'oyhumgag_sa',
      password: 'a%PnNf}(%QB_o+*R',
      charset: 'utf8mb4',
      connectTimeout: 10000,
    }
  },
  {
    name: 'Connection string format',
    connectionString: 'mysql://oyhumgag_sa:a%25PnNf%7D%28%25QB_o%2B%2AR@103.9.76.10:3306/oyhumgag_mstoolsuite'
  }
];

const testConfiguration = async (name: string, config: any, connectionString?: string) => {
  console.log(`\n🔗 Testing: ${name}`);
  
  try {
    let connection;
    
    if (connectionString) {
      console.log(`📍 Connection string: ${connectionString}`);
      connection = await mysql.createConnection(connectionString);
    } else {
      console.log(`📍 Host: ${config.host}:${config.port}`);
      console.log(`👤 User: ${config.user}`);
      console.log(`🗄️ Database: ${config.database || 'none'}`);
      connection = await mysql.createConnection(config);
    }
    
    console.log('✅ Connected successfully!');

    // Test basic query
    const [result] = await connection.execute('SELECT VERSION() as version, NOW() as current_time, USER() as current_user');
    console.log('📊 Database info:', (result as any[])[0]);

    // List databases if not connected to specific one
    if (!config.database && !connectionString?.includes('/oyhumgag_mstoolsuite')) {
      const [databases] = await connection.execute('SHOW DATABASES');
      console.log('📋 Available databases:');
      (databases as any[]).forEach((db: any) => {
        console.log(`  🗄️ ${db.Database}`);
      });
    } else {
      // Check tables in target database
      const dbName = config.database || 'oyhumgag_mstoolsuite';
      const [tables] = await connection.execute(`
        SELECT TABLE_NAME, TABLE_ROWS 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME
      `, [dbName]);

      console.log(`📋 Tables in ${dbName}:`);
      if ((tables as any[]).length === 0) {
        console.log('  📝 No tables found (database is empty)');
      } else {
        (tables as any[]).forEach((table: any) => {
          console.log(`  📊 ${table.TABLE_NAME} (${table.TABLE_ROWS || 0} rows)`);
        });
      }
    }

    await connection.end();
    console.log(`✅ ${name}: SUCCESS`);
    
    return true;

  } catch (error) {
    console.log(`❌ ${name}: FAILED`);
    console.error('Error:', (error as any).message);
    return false;
  }
};

const main = async () => {
  console.log('🔍 Testing multiple MySQL connection configurations...\n');
  
  let successCount = 0;
  
  for (const { name, config, connectionString } of MYSQL_CONFIGS) {
    const success = await testConfiguration(name, config, connectionString);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Results: ${successCount}/${MYSQL_CONFIGS.length} configurations succeeded`);
  
  if (successCount === 0) {
    console.log('\n🚨 All connection attempts failed. Possible issues:');
    console.log('1. ❌ User may only be allowed from localhost/specific IPs');
    console.log('2. ❌ Password contains special characters that need encoding');
    console.log('3. ❌ MySQL server firewall blocking external connections');
    console.log('4. ❌ MySQL server not configured for remote connections');
    console.log('5. ❌ User permissions not set for remote access');
    
    console.log('\n🔧 Recommended actions:');
    console.log('1. 📞 Contact hosting provider to enable remote MySQL access');
    console.log('2. 🔑 Verify user has remote access permissions');
    console.log('3. 🌐 Check if your IP needs to be whitelisted');
    console.log('4. 🔒 Confirm MySQL server allows connections on port 3306');
    
    process.exit(1);
  } else {
    console.log('\n✅ At least one configuration worked! You can proceed with migration.');
    
    // Print working connection string
    const workingConfig = MYSQL_CONFIGS.find((_, index) => index < successCount);
    if (workingConfig?.connectionString) {
      console.log('\n📋 Working connection string for .env.local:');
      console.log(`DATABASE_URL="${workingConfig.connectionString}"`);
    } else if (workingConfig?.config) {
      const encodedPassword = encodeURIComponent(workingConfig.config.password);
      const connectionString = `mysql://${workingConfig.config.user}:${encodedPassword}@${workingConfig.config.host}:${workingConfig.config.port}/${workingConfig.config.database || 'oyhumgag_mstoolsuite'}`;
      console.log('\n📋 Working connection string for .env.local:');
      console.log(`DATABASE_URL="${connectionString}"`);
    }
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

export { testConfiguration }; 