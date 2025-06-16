import Link from 'next/link';
import {
  PageTemplate,
  SectionCard,
  StatusBadge
} from "@/components/templates/page-template";

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
      id: 'quickbug',
      name: 'Quick Bug Reporter',
      description: 'Teams Message Extension để báo cáo bug nhanh với Adaptive Cards',
      icon: '🐞',
      status: 'active',
      href: '/admin/tools/quickbug'
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
    <PageTemplate 
      title="🔧 Tools" 
      description="Quản lý các công cụ tích hợp với MS Teams"
    >
      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div key={tool.id} className="card-standard">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teams-purple/10 rounded-lg">
                  <span className="text-2xl">{tool.icon}</span>
                </div>
                <div>
                  <h3 className="text-card-title">{tool.name}</h3>
                  <StatusBadge 
                    type={
                      tool.status === 'active' ? 'success' : 
                      tool.status === 'planned' ? 'info' : 'warning'
                    }
                  >
                    {tool.status === 'active' ? 'Hoạt động' : 
                     tool.status === 'planned' ? 'Dự định' : 'Dừng'}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">{tool.description}</p>

            <div className="mt-auto">
              {tool.status === 'active' ? (
                <Link
                  href={tool.href}
                  className="btn-primary w-full text-center block"
                >
                  Cấu hình
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 py-2 px-4 rounded-md cursor-not-allowed text-sm font-medium"
                >
                  Chưa khả dụng
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Tool */}
      <SectionCard title="➕ Thêm Tool Mới">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-card-title mb-2">Mở rộng hệ thống</h3>
          <p className="text-sm text-gray-600 mb-6">
            Bạn có thể mở rộng hệ thống bằng cách thêm các công cụ mới
          </p>
          <button
            disabled
            className="btn-secondary opacity-50 cursor-not-allowed"
          >
            Tính năng sắp ra mắt
          </button>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 