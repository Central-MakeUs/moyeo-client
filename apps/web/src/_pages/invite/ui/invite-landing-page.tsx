'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { MeetingInvitationCard, type MeetingInvitation } from '@/entities/meeting';
import { useSession } from '@/entities/session';
import type { ParticipationStatusResponse } from '@/shared/api';
import { Button, Celebration, CTASection, TopAppBar } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { LoginDrawer } from '@/widgets/login-drawer';

import { toParticipationGuide } from '../config/participation-guide';

export interface InviteLandingPageProps {
  /** 경로의 초대 코드. 참여 경로 조립에 쓴다. */
  inviteCode: string;
  /** 정규화된 초대 정보. 모임 이름이 없어 그릴 수 없으면 null. */
  invitation: MeetingInvitation | null;
  /** 서버가 계산한 참여 가능 상태. 응답에 없으면 undefined. */
  participationStatus?: ParticipationStatusResponse | null;
}

interface LoginDrawerState {
  isOpen: boolean;
  type: 'guest' | 'member';
}

const INITIAL_LOGIN_DRAWER_STATE: LoginDrawerState = { isOpen: false, type: 'guest' };

export function InviteLandingPage({
  inviteCode,
  invitation,
  participationStatus,
}: InviteLandingPageProps) {
  const [loginDrawerState, setLoginDrawerState] = useState<LoginDrawerState>(
    INITIAL_LOGIN_DRAWER_STATE
  );

  const participationGuide = toParticipationGuide(participationStatus);

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
            title={participationGuide.title}
            description={participationGuide.description}
          />
        }
        visual={
          // 마감·정원 초과처럼 축하할 상황이 아니면 컨페티를 터뜨리지 않는다.
          <Celebration icon="invitation" hasConfetti={participationGuide.canJoin} />
        }
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
              <Button fullWidth onClick={handleParticipate} disabled={!participationGuide.canJoin}>
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
