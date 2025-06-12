'use client';

import { useState } from 'react';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error' | 'timeout';
  data?: any;
  error?: string;
  duration?: number;
}

export default function TestAPIPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { name: 'Auth Status', path: '/api/auth/teams/status' },
    { name: 'Debug Simple (Fetch) ⭐', path: '/api/debug/simple' },
    { name: 'Teams Chats (Simple) ⭐', path: '/api/teams/chats?limit=3' },
    { name: 'Teams Chats (Alternative)', path: '/api/teams/chats-simple?limit=2' },
    { name: 'Debug Auth (SDK - Slow)', path: '/api/debug/auth' },
    { name: 'Clear Cache (No-op)', path: '/api/teams/chats', method: 'DELETE' },
  ];

  const runSingleTest = async (endpoint: { name: string; path: string; method?: string }): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(endpoint.path, {
        method: endpoint.method || 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const data = await response.json();
      
      return {
        endpoint: endpoint.name,
        status: response.ok ? 'success' : 'error',
        data,
        duration,
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        endpoint: endpoint.name,
        status: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Initialize results with pending status
    const initialResults: TestResult[] = endpoints.map(ep => ({
      endpoint: ep.name,
      status: 'pending',
    }));
    setTestResults(initialResults);
    
    // Run tests in parallel
    const promises = endpoints.map(async (endpoint, index) => {
      const result = await runSingleTest(endpoint);
      
      // Update specific result
      setTestResults(prev => prev.map((r, i) => 
        i === index ? result : r
      ));
      
      return result;
    });
    
    await Promise.all(promises);
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'timeout': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'timeout': return '⏰';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🧪 API Testing</h1>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="btn-primary"
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {result.endpoint}
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(result.status)}`}>
                {getStatusIcon(result.status)} {result.status.toUpperCase()}
                {result.duration && ` (${result.duration}ms)`}
              </div>
            </div>

            {result.data && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                <div className="bg-gray-50 p-3 rounded-lg overflow-auto max-h-64">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {result.error && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Error:</h4>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-blue-900 mb-3">📋 Testing Instructions</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>✅ Success:</strong> API responded successfully within timeout</p>
          <p><strong>❌ Error:</strong> API returned an error response</p>
          <p><strong>⏰ Timeout:</strong> API took longer than 30 seconds to respond</p>
          <p><strong>⏳ Pending:</strong> Test is currently running</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> If you see timeouts, the optimizations are working to prevent Vercel 30s timeouts. 
            The actual endpoints should complete faster than the browser timeout.
          </p>
        </div>
      </div>
    </div>
  );
} 