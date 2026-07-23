// 계정 세션이 필요한 화면의 계층4 가드 자리 — 비로그인 시 /login 으로 리다이렉트.
// 세션 판별·리다이렉트는 후속 작업에서 구현한다.
export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
