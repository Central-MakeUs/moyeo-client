import { BackButton, TopAppBar } from '@/shared/ui';

export default function TermsPage() {
  return (
    <div className="flex h-dvh w-full flex-col bg-white">
      <TopAppBar
        title="이용약관"
        leading={<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />}
      />

      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <article className="flex flex-col pb-10 text-neutral-700">
          <p className="mb-8 text-medium-14 text-neutral-400">최종 수정 일자: 2026.08.06</p>

          <section className="flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제1조 (목적)</h2>

            <p className="text-medium-14">
              본 약관은 ‘모여(MOYEO)’(이하 ‘서비스’)의 이용과 관련하여 서비스 제공자와 이용자 간의
              권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제2조 (서비스의 내용)</h2>

            <p className="text-medium-14">서비스는 다음의 기능을 제공합니다.</p>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>모임 생성 및 초대 링크를 통한 참여</li>
              <li>참여자 가용 일정 취합 및 모임 시간 추천</li>
              <li>참여자 출발지 기반 모임 장소 추천</li>
              <li>모임 정보 및 참여 현황 관리</li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제3조 (이용 자격 및 계정)</h2>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>하나의 소셜 계정(카카오 또는 Apple)으로는 하나의 계정만 사용할 수 있습니다.</li>
              <li>
                계정 관리 책임은 이용자 본인에게 있으며, 계정 도용이나 유출로 발생한 문제에 대해
                서비스는 책임지지 않습니다.
              </li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제4조 (이용자의 의무)</h2>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>서비스를 불법적인 목적으로 이용하지 않습니다.</li>
              <li>
                타인의 계정을 도용하거나 타인의 개인정보를 무단으로 수집 및 이용하지 않습니다.
              </li>
              <li>
                모임 이름, 설명, 커버사진 등에 타인의 권리를 침해하거나 불쾌감을 주는 내용을
                등록하지 않습니다.
              </li>
              <li>서비스의 정상적인 운영을 방해하는 행위를 하지 않습니다.</li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제5조 (게시물 및 콘텐츠)</h2>

            <p className="text-medium-14">
              이용자가 등록한 모임 정보, 커버사진 등의 콘텐츠에 대한 권리는 이용자에게 있습니다.
              다만 서비스 운영에 필요한 범위 내에서 해당 콘텐츠를 저장 및 표시할 수 있습니다.
              제4조를 위반한 콘텐츠는 사전 통지 없이 삭제될 수 있습니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제6조 (초대 링크)</h2>

            <p className="text-medium-14">
              모임 초대 링크를 가진 사람은 누구나 해당 모임에 참여하고 현황을 확인할 수 있습니다.
              링크 공유 범위는 이용자가 직접 관리해야 하며, 링크 유출로 인한 문제에 대한 책임은
              이용자에게 있습니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제7조 (면책 조항)</h2>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-medium-14 marker:text-neutral-400">
              <li>
                서비스가 제공하는 추천 시간과 추천 위치는 참고 목적이며, 정확성이나 적합성을
                보장하지 않습니다.
              </li>
              <li>
                서비스는 일정 조율 도구를 제공할 뿐이며, 실제 모임의 성사나 이행, 이용자 간 분쟁에
                대해 책임지지 않습니다.
              </li>
              <li>
                천재지변, 서비스 점검 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.
              </li>
            </ul>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제8조 (서비스의 변경 및 중단)</h2>

            <p className="text-medium-14">
              운영상 또는 기술적 이유로 서비스 내용이 변경되거나 중단될 수 있습니다. 중요한 변경
              사항은 서비스 내 공지를 통해 사전 안내합니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제9조 (이용 계약의 해지)</h2>

            <p className="text-medium-14">
              이용자는 언제든지 앱 내 회원 탈퇴를 통해 이용 계약을 해지할 수 있습니다. 탈퇴 시
              개인정보 및 생성한 모임 데이터는 개인정보처리방침에 따라 처리됩니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제10조 (약관의 변경)</h2>

            <p className="text-medium-14">
              약관이 변경될 경우 서비스 내 공지를 통해 안내하며, 변경 후에도 서비스를 계속 이용하면
              변경된 약관에 동의한 것으로 간주합니다.
            </p>
          </section>

          <section className="mt-8 flex flex-col gap-3">
            <h2 className="text-bold-16 text-neutral-950">제11조 (문의)</h2>

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
