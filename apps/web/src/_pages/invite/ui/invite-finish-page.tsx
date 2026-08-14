'use client';

import { useRouter } from 'next/navigation';

import { useBackHandler } from '@/shared/model';
import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { useSession } from '@/entities/session';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import Link from 'next/link';

/** 참여를 마친 뒤 나가는 곳. 화면의 "홈으로 돌아가기"와 같은 목적지다. */
const HOME_PATH = '/home';

export interface InviteFinishPageProps {
  inviteCode: string;
}

export function InviteFinishPage({ inviteCode }: InviteFinishPageProps) {
  const session = useSession();
  const router = useRouter();

  // 참여가 끝난 화면이라 뒤로가기가 방금 제출한 입력 폼으로 돌아가면 안 된다.
  // 제출이 `replace`라 방문 기록에는 직전 스텝이 그대로 남아 있어, 네이티브에 맡기면 그리로 간다.
  //
  // push가 아니라 replace다. push하면 기록이 [.., 완료, 홈]이 되어 다음 뒤로가기가 이 화면으로 되돌아온다.
  useBackHandler(() => {
    router.replace(HOME_PATH);
    return true;
  });

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar className="shrink-0" />
      <CompletionLayout
        verticalBias={0.32}
        header={
          <PageHeader
            align="center"
            title={'모임에 참여했어요!'}
            description={'아래 버튼을 눌러 참여 현황을 확인해보세요'}
          />
        }
        visual={<Celebration icon="note-primary" />}
        footer={
          <CTASection
            secondaryAction={
              session.status === 'authenticated' ? (
                <Button variant="link" asChild>
                  <Link href={HOME_PATH}>홈으로 돌아가기</Link>
                </Button>
              ) : undefined
            }
            primaryAction={
              <Button fullWidth asChild>
                <Link href={`/meetings?code=${inviteCode}`}> 참여 현황 확인</Link>
              </Button>
            }
          />
        }
      />
    </div>
  );
}
