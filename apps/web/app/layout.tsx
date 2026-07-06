import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { Toaster } from '../components/auth-ui';
import { Providers } from './providers';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://edham.sa'),
  title: {
    default: 'إدهام - نظام إدارة النقل المبرد | Edham Logistics',
    template: '%s | إدهام',
  },
  description:
    'شركة إدهام للنقل المبرد. تتبع مباشر للأسطول، إدارة شاملة للحمولات المبردة والمجمدة، فواتير إلكترونية.',
  openGraph: {
    title: 'إدهام - نظام إدارة النقل المبرد | Edham Logistics',
    description:
      'شركة إدهام للنقل المبرد. تتبع مباشر للأسطول، إدارة شاملة للحمولات المبردة والمجمدة، فواتير إلكترونية.',
    type: 'website',
    locale: 'ar_SA',
    siteName: 'إدهام للوجستيات',
  },
  icons: { icon: '/logo.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
