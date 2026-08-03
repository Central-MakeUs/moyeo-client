/**
 * 모임 최종 확정 화면(INV-04).
 *
 * 일정과 장소가 모두 확정되면 확정 요청이 이 화면으로 `replace` 한다. 확정은 모임장만
 * 하지만 화면은 참여자 누구나(경로를 아는 사람이면) 볼 수 있어, 현황 화면과 같은 초대 코드
 * 기반 공개 경로에 둔다. 게스트는 `meetingId`를 알 방법이 없기도 하다.
 *
 * 화면 자체는 아직 기획 전이다. 확정 흐름이 404로 끊기지 않도록 자리만 잡아 둔다.
 */
export default function MeetingConfirmedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5">
      <p className="text-center text-bold-18 text-neutral-900">모임이 확정되었어요!</p>
      <p className="pt-2 text-center text-medium-14 text-neutral-500">확정 화면은 준비 중이에요</p>
    </main>
  );
}
