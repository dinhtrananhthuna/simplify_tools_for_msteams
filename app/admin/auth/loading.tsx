import { PageLoadingTemplate } from '@/components/templates/page-template';

export default function AuthLoading() {
  return (
    <PageLoadingTemplate 
      title="🔐 Teams Authentication" 
      description="Đang kiểm tra trạng thái xác thực..."
      text="Checking authentication status..."
    />
  );
} 