import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'إدهام للوجستيات',
  description: 'نظام لوجستي متكامل لسلسلة التبريد والنقل — إدهام للوجستيات',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
