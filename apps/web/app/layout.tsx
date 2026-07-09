import type { Metadata } from 'next';
import '@/_app/globals.css';
import GlobalLayout from '@/shared/ui/layouts/global-layout';
import { QueryProvider } from '@/_app';
import { suit } from '@/_app/fonts';

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
