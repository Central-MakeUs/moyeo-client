import type { Metadata } from 'next';
import '@/_app/globals.css';
import { QueryProvider } from '@/_app';
import { suit } from '@/_app/fonts';
import { SessionProvider } from '@/entities/session';
import { AppLayout } from '@/shared/ui/layouts/app-layout';

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
          <SessionProvider>
            <AppLayout>{children}</AppLayout>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
