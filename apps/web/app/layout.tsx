import type { Metadata } from 'next';
import '@/_app/globals.css';
import { DevAuthPanelMount, QueryProvider } from '@/_app';
import { suit } from '@/_app/fonts';
import { SessionProvider } from '@/entities/session';
import { AppLayout } from '@/shared/ui/layouts/app-layout';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.WEB_BASE_URL ?? 'http://localhost:3000'),
  title: {
    default: '모여',
    template: '%s | 모여',
  },
  description: '함께 만나는 가장 쉬운 방법, 모여',
  itunes: {
    appId: '6797212723',
  },
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
            <DevAuthPanelMount />
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
