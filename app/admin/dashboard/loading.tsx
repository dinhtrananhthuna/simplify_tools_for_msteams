import { PageLoadingTemplate } from '@/components/templates/page-template';

export default function DashboardLoading() {
  return (
    <PageLoadingTemplate 
      title="📊 Dashboard" 
      description="Đang tải thông tin tổng quan..."
      text="Loading dashboard data..."
    />
  );
} 