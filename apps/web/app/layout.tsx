import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/_app/globals.css';
import GlobalLayout from '@/shared/ui/layouts/global-layout';
import { QueryProvider } from '@/_app';

const suit = localFont({
  src: './fonts/SUIT-Variable.woff2',
  variable: '--font-suit',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '모여 WebView',
  description: 'Next.js WebView surface for the Expo native app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${suit.variable}`}>
        <QueryProvider>
          <GlobalLayout>{children}</GlobalLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
