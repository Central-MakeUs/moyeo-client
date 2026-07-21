// 이 라우트 그룹은 계정 세션이 필요한 화면의 배치 경계다.
// 세션 가드와 비로그인 사용자 리다이렉트는 후속 작업에서 구현한다.
export default function AccountLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
