import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MS Teams Tools Suite',
  description: 'Một bộ công cụ tự động hóa cho Microsoft Teams',
  keywords: ['Microsoft Teams', 'automation', 'tools', 'productivity', 'webhooks'],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  publisher: 'Your Name',
  robots: {
    index: false, // Private project
    follow: false,
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    title: 'MS Teams Tools Suite',
    description: 'Một bộ công cụ tự động hóa cho Microsoft Teams',
    siteName: 'MS Teams Tools Suite',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MS Teams Tools Suite',
    description: 'Một bộ công cụ tự động hóa cho Microsoft Teams',
  },
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6264A7', // Teams purple
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-full bg-background">
          {children}
        </div>
      </body>
    </html>
  );
} 