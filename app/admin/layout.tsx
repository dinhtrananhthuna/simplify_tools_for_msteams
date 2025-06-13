import Link from 'next/link';

const navigation = [
  { name: '📊 Dashboard', href: '/admin' },
  { name: '🔐 Teams Auth', href: '/admin/auth' },
  { name: '🔧 Tools', href: '/admin/tools' },
  { name: '🚀 PR Notifier', href: '/admin/tools/pr-notifier' },
  { name: '⚙️ Settings', href: '/admin/settings' },
  { name: '🔗 Webhooks', href: '/admin/webhooks' },
  { name: '🧪 Test API', href: '/admin/test-api' },
  { name: '🔍 Test Auth', href: '/admin/test-auth' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                🚀 MS Teams Tools Suite
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Admin Panel - No Authentication Required
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="bg-white w-64 min-h-screen border-r border-gray-200">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 