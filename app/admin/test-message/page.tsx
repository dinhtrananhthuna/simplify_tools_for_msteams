'use client';

import { useState } from 'react';
import { PageTemplate, SectionCard } from "@/components/templates/page-template";

export default function TestMessagePage() {
  const [chatId, setChatId] = useState('19:281501b700be4da1b8dc8a900428860e@thread.v2');
  const [message, setMessage] = useState('🧪 Test message from debug endpoint');
  const [targetType, setTargetType] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/debug/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message,
          targetType,
        }),
      });
      
      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTemplate 
      title="🧪 Test Message Debug" 
      description="Test gửi tin nhắn đến Teams với chat ID cụ thể và xem logs chi tiết"
    >
      <div className="space-y-6">
        {/* Test Form */}
        <SectionCard title="🔧 Test Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="19:xxxxx@thread.v2"
              />
              <p className="text-sm text-gray-500 mt-1">
                ID của chat/channel cần test
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Tin nhắn test..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Type
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="input-field"
              >
                <option value="auto">Auto-detect (recommended)</option>
                <option value="group">Group Chat only</option>
                <option value="oneOnOne">One-on-One Chat only</option>
                <option value="all">Test all methods</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Cách thức gửi tin nhắn. Auto-detect sẽ sử dụng logic recovery.
              </p>
            </div>

            <button
              onClick={handleTest}
              disabled={isLoading || !chatId.trim()}
              className="btn-primary"
            >
              {isLoading ? '🔄 Testing...' : '🧪 Run Test'}
            </button>
          </div>
        </SectionCard>

        {/* Results */}
        {result && (
          <SectionCard title={result.success ? "✅ Test Results" : "❌ Test Results"}>
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">
                    {result.success ? '✅' : '❌'}
                  </span>
                  <div>
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    <p className="text-sm text-gray-600">
                      {result.timestamp}
                    </p>
                  </div>
                </div>
                
                {result.successfulResult && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-green-700">
                      Success Method: {result.successfulResult.test}
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      Message ID: {result.successfulResult.messageId}
                    </p>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              {result.results && result.results.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    📊 Detailed Test Results
                  </h3>
                  <div className="space-y-3">
                    {result.results.map((testResult: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          testResult.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">
                              {testResult.success ? '✅' : '❌'} {testResult.test}
                            </span>
                            {testResult.messageId && (
                              <p className="text-sm text-gray-600 font-mono mt-1">
                                ID: {testResult.messageId}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            Target: {JSON.stringify(testResult.target)}
                          </div>
                        </div>
                        
                        {testResult.error && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700 font-mono">
                            {testResult.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {result.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-medium text-red-800 mb-2">
                    ❌ Error Details
                  </h3>
                  <pre className="text-sm text-red-700 font-mono whitespace-pre-wrap">
                    {result.error}
                  </pre>
                </div>
              )}

              {/* Raw Response */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  🔍 Raw Response (Click to expand)
                </summary>
                <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs font-mono overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>

              {/* Logs Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Chi tiết logs:</strong> Xem server console để có logs chi tiết về quá trình gửi tin nhắn.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Instructions */}
        <SectionCard title="📝 Hướng dẫn sử dụng">
          <div className="prose prose-sm">
            <h4>🎯 Mục đích</h4>
            <p>
              Endpoint này giúp test việc gửi tin nhắn đến Teams với chat ID cụ thể 
              và debug các vấn đề liên quan đến "Invalid ThreadId".
            </p>

            <h4>🔧 Các loại test</h4>
            <ul>
              <li><strong>Auto-detect:</strong> Sử dụng logic auto-recovery để tự động detect loại chat</li>
              <li><strong>Group Chat:</strong> Gửi như group chat (có thể fail với channel ID)</li>
              <li><strong>One-on-One:</strong> Gửi như 1-on-1 chat</li>
              <li><strong>All methods:</strong> Test tất cả các cách gửi</li>
            </ul>

            <h4>📊 Đọc kết quả</h4>
            <ul>
              <li><strong>✅ Success:</strong> Tin nhắn đã được gửi thành công</li>
              <li><strong>❌ Failed:</strong> Tất cả cách gửi đều thất bại</li>
              <li><strong>Message ID:</strong> ID của tin nhắn đã gửi (nếu thành công)</li>
              <li><strong>Error details:</strong> Chi tiết lỗi để debug</li>
            </ul>

            <h4>🔍 Debugging</h4>
            <p>
              Nếu test thất bại, kiểm tra:
            </p>
            <ul>
              <li>Chat ID có đúng format không</li>
              <li>User có quyền truy cập chat/channel không</li>
              <li>Teams app có đủ permissions không</li>
              <li>Chat/channel có bị xóa không</li>
            </ul>
          </div>
        </SectionCard>
      </div>
    </PageTemplate>
  );
} 