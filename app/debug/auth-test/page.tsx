'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthTestContent() {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      setError(`OAuth Error: ${error}`);
    } else if (code) {
      testTokenExchange(code);
    }
  }, [searchParams]);

  const testTokenExchange = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/auth-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      setDebugResult(result);
      
      if (!response.ok) {
        setError(result.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startAuth = () => {
    // Use window.location for client-side navigation
    const baseUrl = window.location.origin;
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_TEAMS_CLIENT_ID || '',
        response_type: 'code',
        redirect_uri: `${baseUrl}/debug/auth-test`,
        scope: 'offline_access https://graph.microsoft.com/Chat.ReadWrite https://graph.microsoft.com/TeamMember.Read.All https://graph.microsoft.com/User.Read',
        response_mode: 'query',
      });
    
    window.location.href = authUrl;
  };

  return (
    <div className="space-y-4">
      <button
        onClick={startAuth}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Start Auth Test
      </button>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          🔄 Testing token exchange...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          ❌ <strong>Error:</strong> {error}
        </div>
      )}

      {debugResult && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <h3 className="font-bold mb-2">✅ Debug Result:</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AuthTestPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🔍 Auth Flow Debug Test</h1>
      
      <Suspense fallback={<div>Loading...</div>}>
        <AuthTestContent />
      </Suspense>
    </div>
  );
} 