import type { Metadata, Viewport } from 'next';
import '@/_app/globals.css';
import { ClarityInitializer, DevAuthPanelMount, NativeBackProvider, QueryProvider } from '@/_app';
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

/**
 * 확대를 막는다(두 손가락·더블탭 모두).
 *
 * 이 웹은 네이티브 앱의 WebView로도 열린다. 화면이 확대되면 고정 레이아웃이 어긋나고 되돌릴
 * 방법도 마땅치 않아, 앱 안에서는 사고로만 발생한다.
 *
 * CSS `touch-action: manipulation`으로도 더블탭 확대를 막을 수 있지만 쓰지 않는다. 그 값은
 * 자손의 제스처 판정까지 좁혀 캐러셀의 좌우 스와이프를 함께 막는다. 확대를 아예 끄면 더블탭
 * 확대도 같이 사라지므로 여기 한 곳으로 충분하다.
 *
 * Safari는 접근성을 위해 `userScalable: false`를 무시하지만 WKWebView는 따른다. 브라우저로
 * 여는 사용자는 평소대로 확대할 수 있고, 앱 안에서만 고정된다.
 *
 * `width`·`initialScale`은 Next 기본값과 같지만, viewport를 직접 내보내면 기본값이 대체되므로
 * 함께 적는다.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${suit.variable}`}>
        {/* 인증 상태와 관계없이 앱 진입 시 Clarity를 초기화한다. */}
        <ClarityInitializer />
        <QueryProvider>
          <SessionProvider>
            <AppLayout>{children}</AppLayout>
            <NativeBackProvider />
            <DevAuthPanelMount />
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
