# 🚀 MS Teams Tools Suite

Một bộ công cụ tự động hóa cho Microsoft Teams được xây dựng với Next.js và triển khai trên Vercel. Dự án cá nhân sử dụng hoàn toàn các dịch vụ miễn phí.

## 🌟 Tính năng

### 🔔 Pull Request Notifier (Tool đầu tiên)
- Tự động nhận webhook từ Azure DevOps khi có pull request mới
- Gửi thông báo đẹp mắt vào Teams chat group
- Hỗ trợ @mention team members
- Theo dõi trạng thái và lịch sử webhook

### 🔮 Các tools tương lai
- Meeting Scheduler - Tự động tạo meeting
- Status Sync - Đồng bộ status giữa platforms
- File Organizer - Tự động sắp xếp files
- Analytics Dashboard - Insights về team productivity

## 🛠️ Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router)
- **Database:** Neon PostgreSQL (Free tier)
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel (Free tier)
- **Authentication:** Basic Auth (Environment based)
- **APIs:** Microsoft Graph API, Azure DevOps

## 🚀 Quick Start

### 1. Clone và Setup

```bash
git clone <repo-url>
cd simplify-tools-for-msteams
npm install
```

### 2. Environment Variables

Copy `env.example` to `.env.local` và cập nhật các giá trị:

```bash
cp env.example .env.local
```

**Required variables:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ADMIN_USER` & `ADMIN_PASS` - Basic auth credentials
- `ENCRYPTION_KEY` - 32 character string for token encryption
- `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET`, `TEAMS_TENANT_ID` - MS Teams app credentials

### 3. Database Setup

```bash
npm run db:setup
```

### 4. Development

```bash
npm run dev
```

Truy cập `http://localhost:3000` để xem landing page.
Admin panel: `http://localhost:3000/admin` (yêu cầu Basic Auth)

## 📊 Database Schema

### Core Tables

1. **`auth_tokens`** - MS Teams authentication tokens (encrypted)
2. **`tools`** - Tool configurations and status
3. **`webhook_logs`** - Activity tracking và debugging
4. **`tool_settings`** - Global application settings

Chi tiết schema xem trong [`docs/project-overview.md`](docs/project-overview.md).

## 🔐 Security

- **Basic Authentication** cho admin routes
- **Token encryption** trong database
- **Webhook signature validation**
- **Security headers** trên tất cả routes
- **Environment-based configuration**

## 🚢 Deployment (Vercel)

### 1. Connect Repository
- Import project vào Vercel từ GitHub
- Vercel tự động detect Next.js config

### 2. Environment Variables
Copy tất cả variables từ `.env.local` vào Vercel dashboard:
- Settings → Environment Variables
- Add tất cả variables từ `env.example`

### 3. Database Setup
```bash
# Deploy một lần để có VERCEL_URL
vercel --prod

# Setup database với production URL
DATABASE_URL="your-neon-url" npm run db:setup
```

### 4. MS Teams App Registration

1. **Azure Portal** → App Registrations → New registration
2. **Redirect URI:** `https://your-app.vercel.app/api/auth/callback`
3. **API Permissions:**
   - `Chat.ReadWrite`
   - `TeamMember.Read.All`
4. Copy Client ID, Secret, và Tenant ID vào environment variables

## 📋 Setup Pull Request Notifier

### 1. Teams OAuth Setup
1. Truy cập `/admin/tools/pr-notifier`
2. Click "Connect to Teams" để authorize
3. Chọn target chat group

### 2. Azure DevOps Webhook
1. Azure DevOps → Project Settings → Service Hooks
2. Create subscription: "Pull request created"
3. URL: `https://your-app.vercel.app/api/webhooks/azure-devops`
4. Secret: `WEBHOOK_SECRET` value từ environment

### 3. Test
Tạo một pull request test để verify hoạt động.

## 🔧 Development

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── (admin)/           # Protected admin routes
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utilities và business logic
├── types/                 # TypeScript definitions
├── scripts/               # Database scripts
└── docs/                  # Documentation
```

### Available Scripts
```bash
npm run dev        # Development server
npm run build      # Production build
npm run db:setup   # Setup database tables
npm run db:migrate # Run migrations
npm run lint       # ESLint check
```

### Adding New Tools

1. Create tool definition trong `lib/tools/registry.ts`
2. Add configuration component trong `components/tools/`
3. Create API endpoints trong `app/api/`
4. Update types trong `types/index.ts`

Chi tiết xem [`docs/project-overview.md`](docs/project-overview.md).

## 📝 API Endpoints

### Admin APIs
- `GET /api/tools` - List all tools
- `POST /api/tools` - Create/update tool config
- `GET /api/webhooks/logs` - Webhook activity logs

### Webhook Endpoints
- `POST /api/webhooks/azure-devops` - Azure DevOps webhook
- `POST /api/webhooks/[tool]` - Dynamic tool webhooks

### Auth APIs
- `GET /api/auth/teams` - Teams OAuth flow
- `POST /api/auth/teams/callback` - OAuth callback

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npm run db:setup
```

### Webhook Not Working
1. Check webhook logs: `/admin/logs`
2. Verify webhook secret matches
3. Check Azure DevOps service hook configuration

### Teams Authentication Issues
1. Verify Teams app permissions
2. Check redirect URI matches exactly
3. Ensure tenant ID is correct

## 📊 Free Tier Limits

### Vercel
- **Bandwidth:** 100GB/month
- **Function execution:** 100GB-hrs/month
- **Function timeout:** 10 seconds

### Neon
- **Storage:** 3GB
- **Compute:** 20 hours/month
- **Connections:** Limited

Monitor usage trong respective dashboards.

## 🤝 Contributing

Đây là dự án cá nhân, nhưng mọi suggestion và improvement đều welcome!

1. Fork repository
2. Create feature branch
3. Submit pull request với description chi tiết

## 📄 License

MIT License - Xem [LICENSE](LICENSE) file.

---

**🎯 Goal:** Tạo một ecosystem tools hữu ích cho MS Teams với chi phí $0 và hiệu suất cao!

**📚 Documentation:** [`docs/project-overview.md`](docs/project-overview.md) 