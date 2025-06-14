import { PageLoadingTemplate } from '@/components/templates/page-template';

export default function AdminLoading() {
  return (
    <PageLoadingTemplate 
      title="Admin Panel" 
      description="Đang tải trang quản trị..."
      text="Loading..."
    />
  );
} 