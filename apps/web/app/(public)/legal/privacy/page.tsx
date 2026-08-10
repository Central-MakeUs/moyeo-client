import { BackButton, TopAppBar } from '@/shared/ui';

import { PolicySection } from '../_components/policy-section';

export default function PrivacyPage() {
  return (
    <div className="flex h-dvh w-full flex-col bg-white">
      <TopAppBar
        title="개인정보처리방침"
        leading={<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <article className="flex flex-col pb-10 break-keep text-neutral-600">
          <p className="mb-8 text-medium-12 text-neutral-500">최종 수정 일자: 2026.08.09</p>

          <div className="flex flex-col gap-8">
            <PolicySection label="1." title="수집하는 개인정보 항목">
              <p className="text-medium-14">
                모여는 서비스 제공에 필요한 최소한의 정보만 수집합니다.
              </p>

              <p className="mt-2 text-semibold-14 text-neutral-800">소셜 로그인 시 수집하는 정보</p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>
                  <strong className="text-semibold-14 text-neutral-800">카카오 로그인 시</strong>:
                  카카오 회원번호(고유 식별자)
                </li>
                <li>
                  <strong className="text-semibold-14 text-neutral-800">Apple 로그인 시</strong>:
                  Apple 사용자 식별자
                </li>
              </ul>

              <p className="rounded-8 bg-neutral-20 p-4 text-medium-14 text-neutral-600">
                이메일 주소는 수집하지 않습니다. 소셜 로그인 과정에서 이용자가 입력하는 계정 정보는
                카카오 및 Apple에 직접 전달되며, 모여는 이를 수집하거나 보관하지 않습니다.
              </p>

              <p className="mt-2 text-semibold-14 text-neutral-800">
                서비스 이용 과정에서 저장되는 정보
              </p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>서비스 내 닉네임</li>
                <li>모임 방 이름, 설명, 커버사진</li>
                <li>가용일로 선택한 날짜 및 시간대</li>
                <li>모임 장소 추천을 위해 입력한 출발지 주소 정보</li>
                <li>문의하기를 통해 전달한 문의 내용</li>
                <li>앱 내 장소 검색 기록 (개인을 식별할 수 있는 정보와 연결하지 않고 저장)</li>
              </ul>
            </PolicySection>

            <PolicySection label="2." title="수집 및 이용 목적">
              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>회원 식별 및 로그인 상태 유지</li>
                <li>모임 생성 및 참여 서비스 제공</li>
                <li>모임 정보 표시 및 관리</li>
                <li>참여자 일정 조율 및 모임 시간 추천</li>
                <li>출발지 기반 모임 위치 추천</li>
                <li>이용자 문의 응대</li>
                <li>서비스 개선 및 통계 분석</li>
              </ul>
            </PolicySection>

            <PolicySection label="3." title="이미지 파일 및 정보의 처리">
              <p className="text-medium-14">
                모임 커버 사진 및 모임 사진은 사진 라이브러리 접근 권한을 통해 이용자가 직접 선택한
                파일만 수집하며, 선택하지 않은 사진은 열람하지 않습니다.
              </p>

              <p className="text-medium-14">
                업로드된 이미지는 해당 모임의 참여자에게만 표시됩니다.
              </p>

              <p className="text-medium-14">
                사진 라이브러리 접근 권한은 사진 등록 시에만 요청되며, 권한을 허용하지 않아도 기본
                이미지로 모임을 생성할 수 있습니다.
              </p>
            </PolicySection>

            <PolicySection label="4." title="위치 관련 정보의 처리">
              <p className="text-medium-14">
                출발지 주소는 이용자가 직접 입력한 정보만 수집하며, 기기의 위치를 자동으로
                수집하거나 백그라운드에서 추적하지 않습니다.
              </p>

              <p className="text-medium-14">
                입력된 출발지는 해당 모임의 장소 추천 계산에만 사용됩니다.
              </p>
            </PolicySection>

            <PolicySection label="5." title="보유 및 이용 기간">
              <p className="text-medium-14">
                회원 탈퇴 요청 시 수집된 개인정보를 즉시 삭제하며, 이용자가 생성한 모임 정보 및 참여
                데이터도 함께 삭제됩니다.
              </p>
            </PolicySection>

            <PolicySection label="6." title="제3자 제공">
              <p className="text-medium-14">
                수집한 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의해 요구되는 경우는
                예외로 합니다. 소셜 로그인 과정에는 각 플랫폼의 개인정보처리방침이 별도로
                적용됩니다.
              </p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>카카오 로그인: 카카오 개인정보처리방침 적용</li>
                <li>Apple 로그인: Apple 개인정보처리방침 적용</li>
              </ul>
            </PolicySection>

            <PolicySection label="7." title="이용자의 권리">
              <p className="text-medium-14">
                이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있습니다. 앱
                내 회원 탈퇴 기능을 통해 계정과 관련 데이터를 직접 삭제할 수 있으며, 아래 이메일로
                문의하실 수도 있습니다.
              </p>
            </PolicySection>

            <PolicySection label="8." title="개인정보 보호책임자">
              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>서비스명: 모여(MOYEO)</li>
                <li className="break-all">이메일: moyeo.contact@gmail.com</li>
              </ul>
            </PolicySection>
          </div>
        </article>
      </main>
    </div>
  );
}
