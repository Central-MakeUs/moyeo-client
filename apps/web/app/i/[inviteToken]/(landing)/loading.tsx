import Link from 'next/link';

import {
  INVITE_LANDING_DESCRIPTION,
  INVITE_LANDING_HOME_PATH,
  INVITE_LANDING_TITLE,
} from '@/_pages/invite';
import { MeetingInvitationCardSkeleton } from '@/entities/meeting';
import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';

/**
 * 초대 조회를 기다리는 동안의 대기 화면.
 *
 * 제목·설명·버튼 문구는 모임과 무관하게 고정이라 그대로 그린다. 조회가 필요한 카드 내용만
 * 자리표시자로 두면, 값이 도착해도 헤더와 CTA가 움직이지 않는다.
 *
 * 컨페티는 터뜨리지 않는다 — 실제 화면이 뜰 때 한 번 더 터져 두 번 보인다.
 */
export default function InviteLandingLoading() {
  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar className="shrink-0" />
      <CompletionLayout
        header={
          <PageHeader
            align="center"
            title={INVITE_LANDING_TITLE}
            description={INVITE_LANDING_DESCRIPTION}
          />
        }
        visual={<Celebration icon="invitation" />}
        footer={
          <CTASection
            secondaryAction={
              // 조회와 무관한 링크라 로딩 중에도 그대로 동작한다. 빼면 CTA 높이가 바뀌어 화면이 밀린다.
              <Button variant="link" asChild>
                <Link href={INVITE_LANDING_HOME_PATH}>홈으로 가기</Link>
              </Button>
            }
            primaryAction={
              <Button fullWidth disabled>
                모임 참여하기
              </Button>
            }
          />
        }
      >
        <MeetingInvitationCardSkeleton />
      </CompletionLayout>
    </div>
  );
}
