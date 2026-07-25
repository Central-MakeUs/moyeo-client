import type { Metadata } from 'next';
import '@/_app/globals.css';
import { QueryProvider } from '@/_app';
import { suit } from '@/_app/fonts';
import { AppLayout } from '@/shared/ui/layouts/app-layout';

export const metadata: Metadata = {
  title: {
    default: '모여',
    template: '%s | 모여',
  },
  description: '모여와 함께 일정과 장소를 쉽고 편하게 조율해보세요.',
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
          <AppLayout>{children}</AppLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
