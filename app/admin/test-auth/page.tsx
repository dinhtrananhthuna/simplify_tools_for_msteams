'use client';

import { useState } from 'react';
import {
  PageTemplate,
  SectionCard,
  StatusBadge,
  LoadingSpinner,
  ButtonLoading
} from "@/components/templates/page-template";

export default function TestAuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testTeamsAuth = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/auth/teams/status');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateTeamsAuth = async () => {
    try {
      const response = await fetch('/api/auth/teams');
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error);
    }
  };

  return (
    <PageTemplate 
      title="🔍 Test Authentication" 
      description="Kiểm tra trạng thái xác thực MS Teams"
    >
      {/* Test Controls */}
      <SectionCard title="🧪 Authentication Tests">
        <div className="space-y-4">
          <ButtonLoading
            isLoading={isLoading}
            onClick={testTeamsAuth}
            className="w-full btn-primary"
          >
            {isLoading ? 'Checking...' : '🔍 Check Teams Auth Status'}
          </ButtonLoading>

          <button
            onClick={initiateTeamsAuth}
            className="w-full btn-secondary"
          >
            🚀 Start Teams Authentication
          </button>
        </div>
      </SectionCard>

      {/* Results */}
      {result && (
        <SectionCard title="📊 Test Results">
          <div className={`p-4 rounded-lg border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-3">
              <StatusBadge type={result.success ? 'success' : 'failed'}>
                {result.success ? 'Success' : 'Failed'}
              </StatusBadge>
              {result.isAuthenticated && (
                <StatusBadge type="info">Authenticated</StatusBadge>
              )}
            </div>
            <pre className="text-sm overflow-auto whitespace-pre-wrap text-gray-700">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </SectionCard>
      )}

      {/* Instructions */}
      <SectionCard title="📋 Instructions">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <div>
              <h4 className="text-card-title">Check Teams Auth Status</h4>
              <p className="text-sm text-gray-600">Kiểm tra xem đã có token Teams hợp lệ chưa</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <div>
              <h4 className="text-card-title">Start Teams Authentication</h4>
              <p className="text-sm text-gray-600">Bắt đầu quá trình OAuth với Microsoft Teams</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <div>
              <h4 className="text-card-title">Test API</h4>
              <p className="text-sm text-gray-600">Sau khi authentication thành công, test các API endpoints</p>
            </div>
          </div>
        </div>
      </SectionCard>
    </PageTemplate>
  );
} 