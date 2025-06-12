import Link from 'next/link';

export default function ToolsPage() {
  const tools = [
    {
      id: 'pr-notifier',
      name: 'Pull Request Notifier',
      description: 'Tự động gửi thông báo PR từ Azure DevOps đến Teams chat',
      icon: '🔔',
      status: 'active',
      href: '/admin/tools/pr-notifier'
    },
    {
      id: 'future-tool',
      name: 'Future Tool',
      description: 'Placeholder cho các tools sẽ được thêm sau',
      icon: '🚀',
      status: 'planned',
      href: '#'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔧 Tools</h1>
        <p className="text-gray-600 mt-2">
          Quản lý các công cụ tích hợp với MS Teams
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{tool.name}</h3>
                  <div className="flex items-center mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        tool.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : tool.status === 'planned'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tool.status === 'active' ? 'Hoạt động' : 
                       tool.status === 'planned' ? 'Dự định' : 'Dừng'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mt-4 text-sm">{tool.description}</p>

            <div className="mt-6 flex space-x-3">
              {tool.status === 'active' ? (
                <Link
                  href={tool.href}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Cấu hình
                </Link>
              ) : (
                <button
                  disabled
                  className="flex-1 bg-gray-300 text-gray-500 text-center py-2 px-4 rounded-md cursor-not-allowed"
                >
                  Chưa khả dụng
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Tool */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <span className="text-4xl mb-4 block">➕</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Thêm Tool Mới</h3>
        <p className="text-gray-600 mb-4">
          Bạn có thể mở rộng hệ thống bằng cách thêm các công cụ mới
        </p>
        <button
          disabled
          className="bg-gray-300 text-gray-500 py-2 px-4 rounded-md cursor-not-allowed"
        >
          Tính năng sắp ra mắt
        </button>
      </div>
    </div>
  );
} 