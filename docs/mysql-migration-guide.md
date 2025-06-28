# 🚀 MySQL Migration Guide

Hướng dẫn migrate database từ PostgreSQL (Neon) sang MySQL trên VPS.

## 📋 Prerequisites

### 1. MySQL trên VPS
Đảm bảo MySQL đã được cài đặt và cấu hình:

```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database và user
sudo mysql -u root -p
```

```sql
-- Tạo database
CREATE DATABASE teams_tools CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user cho app
CREATE USER 'teams_app'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON teams_tools.* TO 'teams_app'@'%';
FLUSH PRIVILEGES;

-- Test connection
USE teams_tools;
SELECT 'MySQL is ready!' as status;
```

### 2. Firewall Configuration
Mở port MySQL nếu cần truy cập từ bên ngoài:

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 3306

# Or specific IP only
sudo ufw allow from YOUR_VERCEL_IP to any port 3306
```

### 3. Environment Variables
Chuẩn bị MySQL connection string:

```bash
# Format: mysql://username:password@host:port/database
DATABASE_URL="mysql://teams_app:your_secure_password@your-vps-ip:3306/teams_tools"
```

## 🔧 Migration Steps

### Bước 1: Install dependencies

```bash
npm install mysql2 @types/mysql2
```

### Bước 2: Export dữ liệu từ PostgreSQL

```bash
# Đảm bảo DATABASE_URL đang trỏ tới Neon PostgreSQL
npm run export:postgres
```

File `scripts/postgres-export.json` sẽ được tạo chứa tất cả dữ liệu.

### Bước 3: Setup MySQL database

```bash
# Thay DATABASE_URL thành MySQL connection string
DATABASE_URL="mysql://teams_app:password@vps-ip:3306/teams_tools"

# Tạo tables trong MySQL
npm run db:setup-mysql
```

### Bước 4: Import dữ liệu vào MySQL

```bash
# Import dữ liệu đã export
npm run import:mysql
```

### Bước 5: Update codebase

#### 5.1: Backup current database layer
```bash
cp lib/db.ts lib/db-postgres.ts.backup
```

#### 5.2: Replace database connection
```bash
# Option 1: Replace existing db.ts
cp lib/db-mysql.ts lib/db.ts

# Option 2: Update imports gradually
# Thay tất cả imports: @/lib/db → @/lib/db-mysql
```

#### 5.3: Update environment variables
```bash
# .env.local
DATABASE_URL="mysql://teams_app:password@vps-ip:3306/teams_tools"
```

### Bước 6: Test migration

```bash
# Test local với MySQL
npm run dev

# Test database connection
curl http://localhost:3000/api/debug/auth-flow
```

### Bước 7: Deploy to Vercel

1. **Update Vercel environment variables:**
   ```bash
   DATABASE_URL="mysql://teams_app:password@vps-ip:3306/teams_tools"
   ```

2. **Deploy:**
   ```bash
   git add .
   git commit -m "feat: migrate from PostgreSQL to MySQL"
   git push origin main
   ```

3. **Verify production:**
   ```bash
   curl https://your-app.vercel.app/api/debug/auth-flow
   ```

## 🔄 Key Differences: PostgreSQL vs MySQL

| Feature | PostgreSQL | MySQL |
|---------|------------|-------|
| Auto Increment | `SERIAL` | `AUTO_INCREMENT` |
| JSON | `JSONB` | `JSON` |
| Text | `TEXT` | `TEXT` / `VARCHAR(255)` |
| Timestamps | `TIMESTAMP` | `DATETIME` |
| Default Time | `NOW()` | `CURRENT_TIMESTAMP` |
| Update Trigger | `ON UPDATE NOW()` | `ON UPDATE CURRENT_TIMESTAMP` |
| Array Index | `USING GIN` | Not supported |

## 🧪 Testing Checklist

### Database Operations
- [ ] ✅ Connection test
- [ ] ✅ Auth tokens CRUD
- [ ] ✅ Tools configuration
- [ ] ✅ Webhook logs
- [ ] ✅ Tool settings

### Application Features
- [ ] ✅ Teams OAuth flow
- [ ] ✅ PR Notifier setup
- [ ] ✅ Webhook processing
- [ ] ✅ Admin dashboard
- [ ] ✅ Tool management

### Performance
- [ ] ✅ Query response times
- [ ] ✅ Connection pooling
- [ ] ✅ Serverless function execution
- [ ] ✅ Vercel deployment

## 🚨 Troubleshooting

### Connection Issues

```bash
# Test MySQL connection from VPS
mysql -u teams_app -p -h localhost teams_tools

# Test from external IP
mysql -u teams_app -p -h your-vps-ip teams_tools

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Common Errors

1. **Connection timeout:**
   ```
   Error: connect ETIMEDOUT
   ```
   → Check firewall rules và MySQL bind-address

2. **Authentication failed:**
   ```
   Error: Access denied for user
   ```
   → Verify username/password và GRANT permissions

3. **SSL errors:**
   ```
   Error: SSL connection error
   ```
   → Thêm `ssl: false` trong connection config

### Performance Tuning

```sql
-- MySQL configuration for better performance
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL max_connections = 100;
SET GLOBAL query_cache_size = 16M;
```

## 🔙 Rollback Plan

Nếu có vấn đề, có thể rollback về PostgreSQL:

```bash
# 1. Restore database connection
cp lib/db-postgres.ts.backup lib/db.ts

# 2. Update environment
DATABASE_URL="your-neon-postgresql-url"

# 3. Redeploy
git add .
git commit -m "rollback: restore PostgreSQL connection"
git push origin main
```

## ✅ Post-Migration

### 1. Cleanup
```bash
# Remove PostgreSQL dependencies (optional)
npm uninstall pg @types/pg

# Remove backup files
rm lib/db-postgres.ts.backup
rm scripts/postgres-export.json
```

### 2. Monitor
- Database connection health
- Query performance
- Error logs trong Vercel
- VPS resource usage

### 3. Backup Strategy
```bash
# Setup automated MySQL backups
mysqldump -u teams_app -p teams_tools > backup-$(date +%Y%m%d).sql
```

## 💡 Benefits sau Migration

✅ **Không giới hạn compute time**  
✅ **Better performance** với dedicated VPS  
✅ **Full control** over database configuration  
✅ **Cost-effective** long-term  
✅ **No connection limits** như Neon free tier  

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. Check logs: `sudo tail -f /var/log/mysql/error.log`
2. Test connection: `npm run type-check`
3. Verify data: So sánh record counts trước/sau migration
4. Performance: Monitor query execution times

---

**⚠️ Lưu ý quan trọng:**
- Backup tất cả dữ liệu trước khi migrate
- Test thoroughly trên local environment
- Keep PostgreSQL backup trong vài ngày đề phòng
- Monitor application carefully sau deployment 