'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { MeetingInvitationCard, type MeetingInvitation } from '@/entities/meeting';
import { useSession } from '@/entities/session';
import { Button, CTASection, TopAppBar } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { LoginDrawer } from '@/widgets/login-drawer';

export interface InviteLandingPageProps {
  /** 경로의 초대 코드. 참여 경로 조립에 쓴다. */
  inviteCode: string;
  /** 정규화된 초대 정보. 모임 이름이 없어 그릴 수 없으면 null. */
  invitation: MeetingInvitation | null;
}

interface LoginDrawerState {
  isOpen: boolean;
  type: 'guest' | 'member';
}

const INITIAL_LOGIN_DRAWER_STATE: LoginDrawerState = { isOpen: false, type: 'guest' };

export function InviteLandingPage({ inviteCode, invitation }: InviteLandingPageProps) {
  const [loginDrawerState, setLoginDrawerState] = useState<LoginDrawerState>(
    INITIAL_LOGIN_DRAWER_STATE
  );

  const session = useSession();
  const router = useRouter();

  const isLoading = session.status === 'loading';

  const handleParticipate = () => {
    if (isLoading) return;

    if (session.status === 'anonymous') {
      setLoginDrawerState({ isOpen: true, type: 'guest' });
      return;
    }
    if (session.status === 'authenticated') {
      setLoginDrawerState({ isOpen: false, type: 'member' });
      router.push(`/i/${inviteCode}/nickname`);
    }
  };

  const handleOpenChange = useCallback(() => {
    if (session.status === 'error' || session.status === 'loading') return;

    setLoginDrawerState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, [session.status]);

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" />}
      />
      <CompletionLayout
        header={
          <PageHeader
            align="center"
            title="모임 초대장이 왔어요!"
            description="모임에 참여해서 일정과 장소를 정해보세요"
          />
        }
        visual={<Icon name="invitation" className="size-[75px]" />}
        footer={
          <CTASection
            secondaryAction={
              <Button
                fullWidth
                variant="ghost"
                className="text-neutral-500 hover:text-neutral-400"
                // VIEW-01(/meetings/[meetingId])이 아직 없어 갈 곳이 없다.
                // 화면이 생기면 #146 이후 이슈에서 활성 조건을 붙인다(prd.md §4).
                disabled
              >
                <span className="text-bold-14 underline underline-offset-3">진행상황 확인하기</span>
              </Button>
            }
            primaryAction={
              <Button fullWidth onClick={handleParticipate}>
                모임 참여하기
              </Button>
            }
          />
        }
      >
        {invitation && (
          <MeetingInvitationCard
            name={invitation.name}
            description={invitation.description}
            hostNickname={invitation.hostNickname}
          />
        )}
      </CompletionLayout>
      <LoginDrawer
        type={loginDrawerState.type}
        isOpen={loginDrawerState.isOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
