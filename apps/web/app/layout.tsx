import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './styles/globals.css';

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

function AppViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport">
      <div className="app-shell">{children}</div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${suit.variable}`}>
        <AppViewport>{children}</AppViewport>
      </body>
    </html>
  );
}
