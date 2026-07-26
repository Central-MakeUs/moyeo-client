import { ProtectedGuard } from '@/_app/guards/protected-guard';

// 계정 세션이 필요한 화면의 가드. 비로그인 시 /login 으로 보내고 현재 위치를 next 로 보존한다.
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedGuard>{children}</ProtectedGuard>;
}
