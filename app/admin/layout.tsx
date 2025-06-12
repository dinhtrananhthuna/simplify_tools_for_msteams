import Link from 'next/link';
import AuthWrapper from './auth-wrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="page-header sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-2xl">🚀</span>
                  <span className="text-xl font-bold text-teams-purple">
                    MS Teams Tools
                  </span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Admin Panel
                </div>
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-teams-purple transition-colors"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="sidebar w-64 min-h-screen">
            <nav className="p-4 space-y-2">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">📊</span>
                <span className="font-medium">Dashboard</span>
              </Link>

              <Link
                href="/admin/tools"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">🛠️</span>
                <span className="font-medium">Tools</span>
              </Link>

              <Link
                href="/admin/tools/pr-notifier"
                className="flex items-center space-x-3 px-3 py-2 ml-6 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">🔔</span>
                <span className="text-sm">PR Notifier</span>
              </Link>

              <Link
                href="/admin/webhooks"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">📡</span>
                <span className="font-medium">Webhooks</span>
              </Link>

              <Link
                href="/admin/logs"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">📝</span>
                <span className="font-medium">Logs</span>
              </Link>

              <Link
                href="/admin/auth"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">🔐</span>
                <span className="font-medium">Authentication</span>
              </Link>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href="/admin/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg">⚙️</span>
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="main-content flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
} 