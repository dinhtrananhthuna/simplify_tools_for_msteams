'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { name: '📊 Dashboard', href: '/admin' },
  { name: '🔐 Teams Auth', href: '/admin/auth' },
  { name: '🔧 Tools', href: '/admin/tools' },
  { name: '⚙️ Settings', href: '/admin/settings' },
  { name: '🔗 Webhooks', href: '/admin/webhooks' },
];

const toolsSubmenu = [
  { name: '🔔 PR Configurations', href: '/admin/pr-configurations' },
  { name: '🐞 Quick Bug Reporter', href: '/admin/tools/quickbug' },
];

const debuggingItems = [
  { name: '🧪 Test API', href: '/admin/test-api' },
  { name: '🔍 Test Auth', href: '/admin/test-auth' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "Admin Panel" }: AdminLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-teams-purple hover:text-teams-purple/80 transition-colors">
                <h1 className="text-xl font-bold">🚀 MS Teams Tools Suite</h1>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-link text-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="sidebar w-64 min-h-screen">
          <div className="p-4">
            <ul className="space-y-1">
              {/* Main navigation items */}
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-teams-purple text-white'
                        : 'text-gray-600 hover:text-teams-purple hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Show Tools submenu when Tools is active or when in Tools section */}
                  {item.name === '🔧 Tools' && (isActive(item.href) || pathname?.startsWith('/admin/tools') || pathname?.startsWith('/admin/pr-configurations')) && (
                    <ul className="mt-1 space-y-1">
                      {toolsSubmenu.map((subItem) => (
                        <li key={subItem.name}>
                          <Link
                            href={subItem.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ml-3 ${
                              isActive(subItem.href)
                                ? 'bg-teams-purple text-white'
                                : 'text-gray-600 hover:text-teams-purple hover:bg-gray-50'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              
              {/* Debugging section */}
              <li className="pt-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  🐛 Debugging
                </div>
                <ul className="mt-1 space-y-1">
                  {debuggingItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ml-3 ${
                          isActive(item.href)
                            ? 'bg-teams-purple text-white'
                            : 'text-gray-600 hover:text-teams-purple hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
} 