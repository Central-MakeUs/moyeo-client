import { BackButton, TopAppBar } from '@/shared/ui';

export default function PrivacyPage() {
  return (
    <div className="flex h-dvh w-full flex-col bg-white">
      <TopAppBar
        title="개인정보처리방침"
        leading={<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <article className="flex flex-col pb-10 text-neutral-700">
          <p className="mb-8 text-medium-14 text-neutral-400">최종 수정 일자: 2026.08.01</p>

          <section className="flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">1. 수집하는 개인정보 항목</h2>

            <p className="text-medium-14">모여는 소셜 로그인을 통해 다음의 정보를 수집합니다.</p>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>
                <strong className="font-bold text-neutral-800">카카오 로그인 시</strong>: 카카오
                계정 이메일 주소, 이름
              </li>
              <li>
                <strong className="font-bold text-neutral-800">Apple 로그인 시</strong>: Apple ID
                이메일 주소 (또는 Apple이 제공하는 익명 릴레이 이메일), 이름
              </li>
            </ul>

            <p className="mt-2 text-medium-14">서비스 이용 과정에서 다음의 데이터가 저장됩니다.</p>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>서비스 내 닉네임 및 프로필 사진</li>
              <li>모임 방 이름, 설명, 커버 사진</li>
              <li>가용일로 선택한 날짜 및 시간대</li>
              <li>모임 장소 추천을 위해 입력한 출발지 주소 정보</li>
              <li>서비스 이용 기록(접속 일시, 기기 정보), 푸시 알림 토큰</li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">2. 수집 및 이용 목적</h2>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>회원 식별 및 로그인 상태 유지</li>
              <li>모임 생성 및 참여 서비스 제공</li>
              <li>참여자 일정 조율 및 모임 시간 추천</li>
              <li>출발지 기반 모임 위치 추천</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">3. 위치 관련 정보의 처리</h2>

            <p className="text-medium-14">
              출발지 주소는 이용자가 직접 입력하거나 선택한 정보만 수집하며, 입력된 출발지는 해당
              모임의 장소 추천 목적으로만 사용됩니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">4. 보유 및 이용 기간</h2>

            <p className="text-medium-14">
              회원 탈퇴 요청 시 수집된 개인정보를 즉시 삭제하며, 이용자가 생성한 모임 및 참여
              데이터도 함께 삭제됩니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">5. 제3자 제공</h2>

            <p className="text-medium-14">
              수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의해 요구되는 경우는 예외로
              합니다. 소셜 로그인 과정에는 각 플랫폼의 개인정보처리방침이 별도로 적용됩니다.
            </p>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>카카오 로그인: 카카오 개인정보처리방침 적용</li>
              <li>Apple 로그인: Apple 개인정보처리방침 적용</li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">6. 이용자의 권리</h2>

            <p className="text-medium-14">
              이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있으며, 앱 내
              회원 탈퇴를 통해 개인정보 처리를 정지할 수 있습니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">7. 개인정보 보호책임자</h2>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>서비스명: 모여(MOYEO)</li>
              <li>이메일: moyeo.contact@gmail.com</li>
            </ul>
          </section>
        </article>
      </main>
    </div>
  );
}
