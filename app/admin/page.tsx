import Link from 'next/link';
import {
  PageTemplate,
  StatsGrid,
  StatCard,
  SectionCard
} from "@/components/templates/page-template";

export default function AdminDashboard() {
  return (
    <PageTemplate 
      title="📊 Admin Dashboard" 
      description="Quản lý MS Teams Tools Suite - Không cần authentication"
    >
      {/* Quick Stats */}
      <StatsGrid>
        <StatCard
          label="Tools Installed"
          value="1"
          icon="🔧"
        />
        <StatCard
          label="Webhook Status"
          value="Active"
          icon="📡"
          color="success"
        />
        <StatCard
          label="System Status"
          value="Ready"
          icon="🚀"
          color="success"
        />
        <StatCard
          label="Auth Status"
          value="Optional"
          icon="🔐"
          color="warning"
        />
      </StatsGrid>

      {/* Quick Actions */}
      <SectionCard title="⚡ Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/dashboard"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-card-title mb-2">View Dashboard</h3>
            <p className="text-meta">Detailed analytics and recent activity</p>
          </Link>

          <Link
            href="/admin/tools/pr-notifier"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">🔔</div>
            <h3 className="text-card-title mb-2">Configure PR Notifier</h3>
            <p className="text-meta">Set up Azure DevOps integration</p>
          </Link>

          <Link
            href="/admin/auth"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-card-title mb-2">Teams Authentication</h3>
            <p className="text-meta">Connect to Microsoft Teams</p>
          </Link>

          <Link
            href="/admin/webhooks"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">📡</div>
            <h3 className="text-card-title mb-2">Webhook Logs</h3>
            <p className="text-meta">Monitor webhook activity</p>
          </Link>

          <Link
            href="/admin/settings"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="text-card-title mb-2">System Settings</h3>
            <p className="text-meta">Configure system preferences</p>
          </Link>

          <Link
            href="/admin/test-api"
            className="card-compact text-center hover:border-teams-purple hover:bg-teams-purple hover:bg-opacity-5"
          >
            <div className="text-3xl mb-3">🧪</div>
            <h3 className="text-card-title mb-2">Test API</h3>
            <p className="text-meta">Test system functionality</p>
          </Link>
        </div>
      </SectionCard>

      {/* System Information */}
      <SectionCard title="ℹ️ System Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">🔧 Available Tools</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center space-x-2">
                  <span>🔔</span>
                  <span className="text-sm font-medium">PR Notifier</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Available</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">📊 System Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="text-sm">Environment</span>
                <span className="text-xs font-mono text-gray-600">Development</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="text-sm">Version</span>
                <span className="text-xs font-mono text-gray-600">1.0.0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                <span className="text-sm">Last Updated</span>
                <span className="text-xs text-gray-600">{new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Getting Started */}
      <SectionCard title="🚀 Getting Started">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-3">📋 Setup Checklist</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span className="text-sm text-blue-700">System is running</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⏳</span>
              <span className="text-sm text-blue-700">
                <Link href="/admin/auth" className="text-link">Connect to Microsoft Teams</Link>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⏳</span>
              <span className="text-sm text-blue-700">
                <Link href="/admin/tools/pr-notifier" className="text-link">Configure PR Notifier tool</Link>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">⏳</span>
              <span className="text-sm text-blue-700">Set up Azure DevOps webhook</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 