/**
 * 출발지 입력과 검색 모달을 나란히 그린다.
 *
 * 검색을 평범한 하위 라우트로 두면 위저드 레이아웃의 앱 바와 검색 화면의 앱 바가 겹쳐
 * 헤더가 두 겹이 된다. 병렬 슬롯의 모달은 위저드 셸과 형제로 그려져 그 문제가 없고,
 * children이 언마운트되지 않아 검색을 오갈 때 입력 화면 상태가 유지된다.
 */
export default function DepartureLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
