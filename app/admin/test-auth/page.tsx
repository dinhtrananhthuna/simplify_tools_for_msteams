'use client';

import { useState } from 'react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🔍 Test Authentication</h1>
        <p className="text-gray-600 mt-2">
          Kiểm tra trạng thái xác thực MS Teams
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Authentication Tests</h2>
        <div className="space-y-4">
          <button
            onClick={testTeamsAuth}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? '🔄 Checking...' : '🔍 Check Teams Auth Status'}
          </button>

          <button
            onClick={initiateTeamsAuth}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            🚀 Start Teams Authentication
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Test Results</h2>
          <div className={`p-4 rounded-lg border ${
            result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <pre className="text-sm overflow-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 Instructions</h2>
        <div className="text-blue-800 space-y-2 text-sm">
          <p><strong>1. Check Teams Auth Status:</strong> Kiểm tra xem đã có token Teams hợp lệ chưa</p>
          <p><strong>2. Start Teams Authentication:</strong> Bắt đầu quá trình OAuth với Microsoft Teams</p>
          <p><strong>3. Test API:</strong> Sau khi authentication thành công, test các API endpoints</p>
        </div>
      </div>
    </div>
  );
} 