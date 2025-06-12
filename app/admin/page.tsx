import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Quản lý MS Teams Tools Suite - Không cần authentication
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Tools</h3>
              <p className="text-sm text-gray-600">Đã cài đặt: 1</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">📡</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Webhooks</h3>
              <p className="text-sm text-gray-600">Đang hoạt động</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">🚀</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Status</h3>
              <p className="text-sm text-green-600">Sẵn sàng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/tools/pr-notifier"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-3xl mb-2 block">🔔</span>
              <h3 className="font-medium text-gray-900">PR Notifier</h3>
              <p className="text-sm text-gray-600 mt-1">Cấu hình thông báo</p>
            </div>
          </Link>

          <Link
            href="/admin/test-api"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-3xl mb-2 block">🧪</span>
              <h3 className="font-medium text-gray-900">Test API</h3>
              <p className="text-sm text-gray-600 mt-1">Kiểm tra kết nối</p>
            </div>
          </Link>

          <Link
            href="/admin/webhooks"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-3xl mb-2 block">📡</span>
              <h3 className="font-medium text-gray-900">Webhooks</h3>
              <p className="text-sm text-gray-600 mt-1">Quản lý webhook</p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <span className="text-3xl mb-2 block">⚙️</span>
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Cài đặt hệ thống</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 System Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Environment:</span>
            <span className="ml-2 text-gray-600">Development</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Framework:</span>
            <span className="ml-2 text-gray-600">Next.js 14</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Database:</span>
            <span className="ml-2 text-gray-600">Neon PostgreSQL</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Authentication:</span>
            <span className="ml-2 text-green-600">Disabled (Development)</span>
          </div>
        </div>
      </div>
    </div>
  );
} 