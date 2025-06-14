import React from 'react';
import { Loading, LoadingSpinner as UILoadingSpinner, PageLoading, InlineLoading } from '@/components/ui/loading';
import { LoadingOverlay, ButtonLoading } from '@/components/ui/loading-overlay';

interface PageTemplateProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Standard Page Template - Sử dụng design system chuẩn
 * 
 * Usage:
 * <PageTemplate title="Dashboard" description="Overview của MS Teams Tools Suite">
 *   <YourContent />
 * </PageTemplate>
 */
export function PageTemplate({ title, description, children, actions }: PageTemplateProps) {
  return (
    <div className="page-layout">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{title}</h1>
            {description && <p className="page-description">{description}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </div>
      <div className="list-spacious">
        {children}
      </div>
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: 'default' | 'success' | 'warning' | 'error';
}

export function StatCard({ label, value, icon, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600'
  };

  return (
    <div className="card-standard">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-meta">{label}</p>
          <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Standard Section Card - Card chuẩn cho sections
 */
export function SectionCard({ title, children, actions }: SectionCardProps) {
  return (
    <div className="card-standard">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-section-title">{title}</h2>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface CompactListProps {
  children: React.ReactNode;
}

export function CompactList({ children }: CompactListProps) {
  return <div className="list-compact">{children}</div>;
}

interface CompactListItemProps {
  icon?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: React.ReactNode;
  actions?: React.ReactNode;
  error?: string;
  children?: React.ReactNode;
}

export function CompactListItem({ 
  icon, 
  title, 
  subtitle, 
  meta, 
  status, 
  actions, 
  error,
  children 
}: CompactListItemProps) {
  return (
    <div className="card-compact">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {icon && <span className="text-base flex-shrink-0">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-card-title truncate">{title}</h3>
              {subtitle && (
                <>
                  <span className="text-xs text-gray-400">from</span>
                  <span className="text-xs text-gray-600 font-medium">{subtitle}</span>
                </>
              )}
            </div>
            {meta && (
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-meta">{meta}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {status}
          {actions}
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

interface StatusBadgeProps {
  type: 'success' | 'failed' | 'warning' | 'info';
  children: React.ReactNode;
}

export function StatusBadge({ type, children }: StatusBadgeProps) {
  const classes = {
    success: 'status-success',
    failed: 'status-failed', 
    warning: 'status-warning',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${classes[type]}`}>
      {children}
    </span>
  );
}

interface TeamsBadgeProps {
  messageId?: string;
}

/**
 * Teams Message Badge - Badge chuẩn cho Teams messages
 */
export function TeamsBadge({ messageId }: TeamsBadgeProps) {
  return (
    <div className="teams-badge">
      <span className="text-green-600 text-xs">💬</span>
      <span className="text-xs text-green-700 font-medium">Teams sent</span>
      {messageId && (
        <span className="text-xs text-green-600 font-mono">
          {messageId.slice(-8)}
        </span>
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Loading State - Loading chuẩn
 */
export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return <UILoadingSpinner size={size === 'md' ? 'default' : size} />;
}

/**
 * Page Loading Template - Sử dụng cho loading toàn trang
 */
interface PageLoadingTemplateProps {
  title?: string;
  description?: string;
  text?: string;
}

export function PageLoadingTemplate({ title, description, text }: PageLoadingTemplateProps) {
  return <PageLoading title={title} description={description} text={text} />;
}

/**
 * Section Loading - Loading cho từng section
 */
interface SectionLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionLoading({ text = "Đang tải...", size = 'lg' }: SectionLoadingProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <UILoadingSpinner size={size === 'md' ? 'default' : size} className="mx-auto mb-4" />
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
}

/**
 * Inline Loading - Loading nhỏ cho buttons, etc
 */
export function InlineLoadingSpinner({ text, size = 'default' }: { text?: string; size?: 'sm' | 'default' }) {
  return <InlineLoading text={text} size={size} />;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {action}
    </div>
  );
}

// Export loading overlay components
export { LoadingOverlay, ButtonLoading };

// Export default
export default PageTemplate; 