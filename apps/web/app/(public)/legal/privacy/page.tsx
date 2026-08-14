import { BackButton, TopAppBar } from '@/shared/ui';

import { PolicySection } from '../_components/policy-section';
import { PolicyTable } from '../_components/policy-table';

export default function PrivacyPage() {
  return (
    <div className="flex h-dvh w-full flex-col bg-white">
      <TopAppBar
        title="개인정보처리방침"
        leading={<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <article className="flex flex-col pb-10 break-keep text-neutral-600">
          <p className="mb-8 text-medium-12 text-neutral-500">최종 수정 일자: 2026.08.14</p>

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
                모임 커버사진은 사진 라이브러리 접근 권한을 통해 이용자가 직접 선택한 파일만
                수집하며, 선택하지 않은 사진은 열람하지 않습니다.
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
                입력된 출발지는 좌표 변환 및 이동시간 계산을 위해 카카오 API로 전달되며, 해당 모임의
                장소 추천에만 사용됩니다.
              </p>

              <p className="text-medium-14">
                출발지는 모임 정보와 함께 저장되어 참여자들의 응답을 취합하는 데 사용되며, 회원 탈퇴
                시 삭제됩니다.
              </p>
            </PolicySection>

            <PolicySection label="5." title="보유 및 이용 기간">
              <p className="text-medium-14">
                앱 내 회원 탈퇴 시 수집된 개인정보를 즉시 삭제합니다. 이메일로 삭제를 요청하신 경우
                영업일 기준 7일 이내에 처리합니다.
              </p>

              <p className="mt-2 text-semibold-14 text-neutral-800">탈퇴 시 모임 데이터 처리</p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>
                  이용자가 생성한 모임은 삭제되며, 해당 모임의 참여자에게도 더 이상 표시되지
                  않습니다.
                </li>
                <li>
                  참여자로만 속한 모임에서는 해당 이용자의 정보만 삭제되며, 모임 자체는 유지됩니다.
                </li>
                <li>삭제된 데이터는 복구할 수 없습니다.</li>
              </ul>
            </PolicySection>

            <PolicySection label="6." title="제3자 제공 및 처리위탁">
              <p className="text-medium-14">
                모여는 수집한 개인정보를 제3자에게 판매하거나 마케팅 목적으로 제공하지 않습니다.
                다만 서비스 제공을 위해 아래와 같이 정보를 전달합니다.
              </p>

              <PolicyTable
                headers={['제공받는 자', '제공 항목', '목적']}
                rows={[
                  [
                    '카카오 (Kakao Corp.)',
                    '이용자가 입력한 출발지 주소',
                    '주소 검색 및 이동시간 계산을 통한 모임 장소 추천',
                  ],
                ]}
              />

              <p className="text-medium-14">
                또한 서비스 운영을 위해 아래 사업자에 개인정보 처리를 위탁하고 있습니다.
              </p>

              <PolicyTable
                headers={['수탁자', '위탁 업무']}
                rows={[
                  ['Amazon Web Services, Inc.', '서버 및 데이터베이스 운영(EC2), 이미지 저장(S3)'],
                  ['Vercel Inc.', '웹 프론트엔드 호스팅'],
                ]}
              />

              <p className="text-medium-14">
                소셜 로그인 과정에는 각 플랫폼의 개인정보처리방침이 별도로 적용됩니다.
              </p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>카카오 로그인: 카카오 개인정보처리방침 적용</li>
                <li>Apple 로그인: Apple 개인정보처리방침 적용</li>
              </ul>

              <p className="text-medium-14">
                법령에 의해 요구되는 경우를 제외하고 그 밖의 제3자 제공은 하지 않습니다.
              </p>
            </PolicySection>

            <PolicySection label="7." title="이용자의 권리">
              <p className="text-medium-14">
                이용자는 언제든지 자신의 개인정보에 대해 열람, 수정, 삭제를 요청할 수 있습니다. 앱
                내 회원 탈퇴 기능을 통해 계정과 관련 데이터를 직접 삭제할 수 있으며, 앱을 설치하지
                않은 상태에서도 이메일로 삭제를 요청할 수 있습니다.
              </p>

              <p className="mt-2 text-semibold-14 text-neutral-800">탈퇴 방법</p>

              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>앱 내: 마이페이지 → 도움말 → 회원 탈퇴</li>
                <li className="break-keep">
                  앱 없이 요청: <span className="break-all">moyeo.contact@gmail.com</span> 으로 가입
                  시 사용한 소셜 로그인 종류(카카오/Apple)와 서비스 내 닉네임을 보내주시면, 영업일
                  기준 7일 이내에 삭제 처리 후 회신드립니다.
                </li>
              </ul>
            </PolicySection>

            <PolicySection label="8." title="개인정보 보호책임자">
              <ul className="flex list-disc flex-col gap-2 pl-4 text-medium-14 marker:text-neutral-300">
                <li>서비스명: 모여(MOYEO)</li>
                <li>개인정보 보호책임자: 김세린</li>
                <li className="break-all">이메일: moyeo.contact@gmail.com</li>
              </ul>
            </PolicySection>
          </div>
        </article>
      </main>
    </div>
  );
}
