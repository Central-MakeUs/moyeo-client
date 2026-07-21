// 이 라우트 그룹은 인증 전 사용자가 진입할 수 있는 공개 인증 화면을 관리한다.
// 인증 가드, 미들웨어, 세션 판별은 이 최소 스켈레톤의 범위에서 제외한다.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
