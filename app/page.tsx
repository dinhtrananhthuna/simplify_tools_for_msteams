import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-teams-purple">
                  🚀 MS Teams Tools Suite
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/admin" 
                className="text-gray-600 hover:text-teams-purple transition-colors"
              >
                Admin Panel
              </Link>
              <a 
                href="https://github.com/your-username/simplify-tools-for-msteams" 
                className="text-gray-600 hover:text-teams-purple transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Tự động hóa 
              <span className="text-teams-purple"> Microsoft Teams</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Một bộ công cụ thông minh giúp tự động hóa workflows trong Teams. 
              Từ thông báo pull request đến quản lý meeting - tất cả đều tự động.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin" 
                className="btn-primary inline-flex items-center px-8 py-3 text-lg"
              >
                🎛️ Vào Admin Panel
              </Link>
              <a 
                href="#features" 
                className="btn-secondary inline-flex items-center px-8 py-3 text-lg"
              >
                📋 Xem tính năng
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🛠️ Công cụ hiện có
            </h2>
            <p className="text-lg text-gray-600">
              Các tools đã sẵn sàng để sử dụng
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pull Request Notifier */}
            <div className="tool-card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-teams-purple rounded-lg flex items-center justify-center text-white text-2xl">
                  🔔
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pull Request Notifier
                  </h3>
                  <span className="status-badge status-active">Active</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Tự động thông báo team về pull requests mới từ Azure DevOps. 
                Hỗ trợ @mention và format đẹp mắt.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>✅ Azure DevOps webhook integration</li>
                <li>✅ Custom message templates</li>
                <li>✅ @mention team members</li>
                <li>✅ Webhook logs & monitoring</li>
              </ul>
            </div>

            {/* Meeting Scheduler - Coming Soon */}
            <div className="tool-card tool-card-inactive">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center text-white text-2xl">
                  📅
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Meeting Scheduler
                  </h3>
                  <span className="status-badge status-setup-needed">Coming Soon</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Tự động tạo và quản lý meetings từ calendar events. 
                Sync với Outlook và Teams calendar.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>🔄 Calendar integration</li>
                <li>🔄 Auto-create Teams meetings</li>
                <li>🔄 Meeting reminders</li>
                <li>🔄 Attendee management</li>
              </ul>
            </div>

            {/* Status Sync - Coming Soon */}
            <div className="tool-card tool-card-inactive">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center text-white text-2xl">
                  🔄
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Status Sync
                  </h3>
                  <span className="status-badge status-setup-needed">Coming Soon</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Đồng bộ status giữa Teams, Slack, và các platforms khác. 
                Tự động cập nhật based on availability.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>🔄 Multi-platform sync</li>
                <li>🔄 Auto status updates</li>
                <li>🔄 Custom status rules</li>
                <li>🔄 Do Not Disturb integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ⚡ Tech Stack
            </h2>
            <p className="text-lg text-gray-600">
              Xây dựng với công nghệ hiện đại và deploy miễn phí
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚛️</span>
              </div>
              <h3 className="font-medium text-gray-900">Next.js 14</h3>
              <p className="text-sm text-gray-500">App Router</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🐘</span>
              </div>
              <h3 className="font-medium text-gray-900">PostgreSQL</h3>
              <p className="text-sm text-gray-500">Neon (Free)</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">▲</span>
              </div>
              <h3 className="font-medium text-gray-900">Vercel</h3>
              <p className="text-sm text-gray-500">Serverless</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💜</span>
              </div>
              <h3 className="font-medium text-gray-900">Teams API</h3>
              <p className="text-sm text-gray-500">Graph API</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 MS Teams Tools Suite
            </h3>
            <p className="text-gray-600 mb-4">
              Dự án cá nhân tự động hóa Microsoft Teams workflows
            </p>
            <div className="flex justify-center space-x-6">
              <Link 
                href="/admin" 
                className="text-gray-400 hover:text-teams-purple transition-colors"
              >
                Admin Panel
              </Link>
              <a 
                href="https://github.com/your-username/simplify-tools-for-msteams" 
                className="text-gray-400 hover:text-teams-purple transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-400 text-sm">
                © 2024 MS Teams Tools Suite. Made with ❤️ in Vietnam.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 