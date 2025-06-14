import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="page-layout">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-teams-purple">
                  🚀 MS Teams Tools Suite
                </h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/admin" 
                className="text-link"
              >
                Admin Panel
              </Link>
              <a 
                href="https://github.com/your-username/simplify-tools-for-msteams" 
                className="text-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teams-purple to-purple-700 text-white">
        <div className="page-layout">
          <div className="py-20 text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              MS Teams Tools Suite
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
              Powerful automation tools for Microsoft Teams integration with Azure DevOps and more
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="bg-white text-teams-purple px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                🎛️ Open Admin Panel
              </Link>
              <a
                href="https://github.com/your-username/simplify-tools-for-msteams"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-teams-purple transition-colors"
              >
                📚 View Documentation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="page-layout">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🌟 Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline your development workflow with Microsoft Teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-standard text-center">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-section-title mb-3">PR Notifications</h3>
              <p className="text-gray-600 mb-4">
                Get instant notifications in Teams when pull requests are created, updated, or merged in Azure DevOps
              </p>
              <div className="text-sm text-gray-500">
                ✅ Real-time alerts<br/>
                ✅ Customizable messages<br/>
                ✅ Adaptive Cards support
              </div>
            </div>

            <div className="card-standard text-center">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-section-title mb-3">Webhook Management</h3>
              <p className="text-gray-600 mb-4">
                Robust webhook handling with logging, error tracking, and automatic retry mechanisms
              </p>
              <div className="text-sm text-gray-500">
                ✅ Secure endpoints<br/>
                ✅ Detailed logging<br/>
                ✅ Error handling
              </div>
            </div>

            <div className="card-standard text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-section-title mb-3">Analytics Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Monitor your integrations with comprehensive analytics and real-time status updates
              </p>
              <div className="text-sm text-gray-500">
                ✅ Real-time metrics<br/>
                ✅ Success rates<br/>
                ✅ Performance insights
              </div>
            </div>

            <div className="card-standard text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-section-title mb-3">Secure Authentication</h3>
              <p className="text-gray-600 mb-4">
                OAuth 2.0 integration with Microsoft Teams for secure and seamless authentication
              </p>
              <div className="text-sm text-gray-500">
                ✅ OAuth 2.0<br/>
                ✅ Token refresh<br/>
                ✅ Encrypted storage
              </div>
            </div>

            <div className="card-standard text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-section-title mb-3">Easy Configuration</h3>
              <p className="text-gray-600 mb-4">
                Simple web interface for configuring tools, managing settings, and monitoring system health
              </p>
              <div className="text-sm text-gray-500">
                ✅ Web interface<br/>
                ✅ No coding required<br/>
                ✅ Live configuration
              </div>
            </div>

            <div className="card-standard text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-section-title mb-3">Production Ready</h3>
              <p className="text-gray-600 mb-4">
                Built with Next.js and deployed on Vercel for maximum reliability and performance
              </p>
              <div className="text-sm text-gray-500">
                ✅ Next.js 14<br/>
                ✅ TypeScript<br/>
                ✅ Vercel hosting
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="bg-gray-100 py-20">
        <div className="page-layout">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🚀 Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to set up your MS Teams integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teams-purple text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-section-title mb-3">Connect to Teams</h3>
              <p className="text-gray-600">
                Authenticate with your Microsoft Teams account to enable message sending
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teams-purple text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-section-title mb-3">Configure Tools</h3>
              <p className="text-gray-600">
                Set up your desired tools like PR Notifier with your Azure DevOps settings
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teams-purple text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-section-title mb-3">Start Receiving</h3>
              <p className="text-gray-600">
                Begin receiving automated notifications and updates directly in your Teams channels
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/admin"
              className="btn-primary text-lg px-8 py-4"
            >
              🎛️ Open Admin Panel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="page-layout">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 MS Teams Tools Suite
            </h3>
            <p className="text-gray-600 mb-6">
              Streamline your development workflow with powerful Microsoft Teams integrations
            </p>
            <div className="flex justify-center space-x-6">
              <Link href="/admin" className="text-link">
                Admin Panel
              </Link>
              <a 
                href="https://github.com/your-username/simplify-tools-for-msteams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                GitHub
              </a>
              <a 
                href="https://docs.microsoft.com/en-us/microsoftteams/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Teams Docs
              </a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                © 2024 MS Teams Tools Suite. Built with ❤️ using Next.js and TypeScript.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 