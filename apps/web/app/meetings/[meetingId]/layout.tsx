// 모임 현황(VIEW-01) 영역. 로그인 여부와 무관하게 공개 열람되며 가드가 없다.
export default function MeetingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
