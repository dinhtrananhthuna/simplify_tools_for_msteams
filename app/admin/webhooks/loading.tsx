import { PageLoadingTemplate } from '@/components/templates/page-template';

export default function WebhooksLoading() {
  return (
    <PageLoadingTemplate 
      title="📡 Webhooks" 
      description="Đang tải webhook logs..."
      text="Loading webhook data..."
    />
  );
} 