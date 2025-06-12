import Link from 'next/link';

export default function ToolsPage() {
  const tools = [
    {
      id: 'pr-notifier',
      name: 'Pull Request Notifier',
      description: 'Tự động thông báo team về pull requests mới từ Azure DevOps',
      icon: '🔔',
      status: 'active' as const,
      category: 'automation',
      lastActivity: '2 phút trước',
      totalEvents: 156,
      successRate: 98.5,
      configPath: '/admin/tools/pr-notifier',
    },
    {
      id: 'meeting-scheduler',
      name: 'Meeting Scheduler',
      description: 'Tự động tạo và quản lý meetings từ calendar events',
      icon: '📅',
      status: 'setup_needed' as const,
      category: 'productivity',
      lastActivity: 'Chưa có',
      totalEvents: 0,
      successRate: 0,
      configPath: '/admin/tools/meeting-scheduler',
    },
    {
      id: 'status-sync',
      name: 'Status Sync',
      description: 'Đồng bộ status giữa Teams, Slack và các platforms khác',
      icon: '🔄',
      status: 'setup_needed' as const,
      category: 'integration',
      lastActivity: 'Chưa có',
      totalEvents: 0,
      successRate: 0,
      configPath: '/admin/tools/status-sync',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'setup_needed':
        return 'status-badge status-setup-needed';
      case 'error':
        return 'status-badge status-error';
      default:
        return 'status-badge status-inactive';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'inactive':
        return 'Tạm dừng';
      case 'setup_needed':
        return 'Cần cấu hình';
      case 'error':
        return 'Lỗi';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tools Management</h1>
          <p className="text-gray-600">Quản lý và cấu hình các tools tự động hóa</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn-secondary">
            📊 View Analytics
          </button>
          <button className="btn-primary">
            ➕ Add New Tool
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-teams-purple rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🛠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tools</p>
              <p className="text-2xl font-semibold text-gray-900">{tools.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-teams-green rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Tools</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tools.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-teams-blue rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tools.reduce((sum, tool) => sum + tool.totalEvents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-teams-orange rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📈</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(tools.reduce((sum, tool) => sum + tool.successRate, 0) / tools.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`tool-card ${tool.status === 'active' ? 'tool-card-active' : ''} ${
              tool.status === 'setup_needed' ? 'tool-card-inactive' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-2xl ${
                  tool.status === 'active' ? 'bg-teams-purple' : 'bg-gray-400'
                }`}>
                  {tool.icon}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                  <span className={getStatusBadge(tool.status)}>
                    {getStatusText(tool.status)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-sm">{tool.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hoạt động gần nhất:</span>
                <span className="text-gray-900">{tool.lastActivity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng events:</span>
                <span className="text-gray-900">{tool.totalEvents.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Success rate:</span>
                <span className="text-gray-900">{tool.successRate}%</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Link
                href={tool.configPath}
                className="btn-primary flex-1 text-center text-sm"
              >
                🔧 Configure
              </Link>
              <button className="btn-secondary px-3">
                📊
              </button>
              <button className="btn-secondary px-3">
                📝
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button className="btn-secondary text-sm">
            🔄 Refresh All
          </button>
          <button className="btn-secondary text-sm">
            📊 View Analytics
          </button>
          <button className="btn-secondary text-sm">
            📝 Export Logs
          </button>
          <button className="btn-secondary text-sm">
            🔐 Check Auth
          </button>
          <button className="btn-secondary text-sm">
            ⚙️ Global Settings
          </button>
        </div>
      </div>
    </div>
  );
} 