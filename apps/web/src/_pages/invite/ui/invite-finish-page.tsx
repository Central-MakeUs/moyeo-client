'use client';

import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { useSession } from '@/entities/session';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import Link from 'next/link';

export interface InviteFinishPageProps {
  inviteCode: string;
}

export function InviteFinishPage({ inviteCode }: InviteFinishPageProps) {
  const session = useSession();

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar className="shrink-0" leading={<div aria-hidden className="size-8" />} />
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
                <Button
                  fullWidth
                  variant="link"
                  className="text-neutral-500 hover:text-neutral-400"
                  asChild
                >
                  <Link href={'/home'}>홈으로 돌아가기</Link>
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
