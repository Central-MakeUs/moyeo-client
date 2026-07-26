import { AuthGuard } from '@/features/auth/session';

// 계정 세션이 필요한 화면의 가드 — 비로그인/만료 시 /login, 미온보딩 시 /nickname으로 리다이렉트.
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthGuard>{children}</AuthGuard>;
}
