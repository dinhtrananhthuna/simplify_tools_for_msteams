import { PageLoadingTemplate } from '@/components/templates/page-template';

export default function PRNotifierLoading() {
  return (
    <PageLoadingTemplate 
      title="🔔 Pull Request Notifier" 
      description="Đang tải cấu hình PR Notifier..."
      text="Loading PR Notifier configuration..."
    />
  );
} 