'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useGuestSession } from '@/entities/guest-session';
import { DeleteMeetingDialog, useDeleteMeeting } from '@/features/meeting/delete-meeting';
import {
  EditMeetingNicknameDrawer,
  useEditMeetingNickname,
  useMyMeetingNickname,
} from '@/features/meeting/edit-meeting-nickname';
import { toInviteShareUrl, useInviteShare } from '@/features/meeting/invite-share';
import { LeaveMeetingDialog, useLeaveMeeting } from '@/features/meeting/leave-meeting';
import { useGetMeetingView } from '@/shared/api';
import { toast } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import { toLeaveMeetingTarget } from '../model/to-leave-meeting-target';
import { useMeetingViewerRole } from '../model/use-meeting-viewer-role';
import { MeetingMenuDrawer, type MeetingMenuItem } from './meeting-menu-drawer';

/** 메뉴에서 이어 여는 오버레이. 한 번에 하나만 뜬다. */
type MenuSheet = 'edit-nickname' | 'delete-meeting' | 'leave-meeting';

const UNAVAILABLE_MESSAGE = '잠시 후 다시 시도해주세요';

/**
 * 메뉴 Drawer가 닫히는 데 걸리는 시간(vaul 기본 전환 0.5s).
 *
 * vaul의 `onAnimationEnd`를 쓰지 않는다. 그 콜백은 Drawer가 스스로 닫을 때만 오고, 여기처럼
 * 밖에서 `open`을 내려 닫으면 오지 않는다 — 기다리다 다음 Drawer를 영영 못 연다.
 */
const MENU_CLOSE_MS = 500;

export interface MeetingOverviewTopBarProps {
  /** 현황을 보고 있는 모임의 초대 코드. */
  inviteCode: string;
}

/**
 * 현황 화면(VIEW-01) 상단바.
 *
 * 커버 사진 위에 얹히므로 배경이 없고 아이콘이 흰색이다.
 *
 * 뒤로가기·더보기는 이 모임의 참여자에게만 보인다(VIEW-01-F05). 링크만 열어본 사람에게는
 * 돌아갈 이전 화면도, 실행할 메뉴도 없기 때문이다. 역할이 아직 판별되지 않은 동안에도
 * 감춘다 — 참여자가 아닌 사람에게 잠깐 보였다 사라지는 편보다 낫다.
 */
export function MeetingOverviewTopBar({
  inviteCode,
}: MeetingOverviewTopBarProps): React.JSX.Element {
  const router = useRouter();
  const role = useMeetingViewerRole(inviteCode);
  const { nickname: guestNickname } = useGuestSession(inviteCode);

  // 현황 화면이 이미 읽은 조회다. 같은 키라 추가 요청 없이 meetingId만 가져다 쓴다.
  const { data: meeting } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [openSheet, setOpenSheet] = React.useState<MenuSheet | null>(null);
  /** 메뉴를 닫는 중이고, 사라지면 열어야 할 오버레이. */
  const [pendingSheet, setPendingSheet] = React.useState<MenuSheet | null>(null);

  /**
   * 메뉴가 사라진 뒤에 다음 오버레이를 연다. 둘을 겹쳐 띄우면 스크롤 잠금과 포커스 트랩이
   * 서로를 덮어써 배경이 잠긴 채로 남는다.
   */
  React.useEffect(() => {
    if (pendingSheet === null) return;

    const timer = window.setTimeout(() => {
      setOpenSheet(pendingSheet);
      setPendingSheet(null);
    }, MENU_CLOSE_MS);

    return () => window.clearTimeout(timer);
  }, [pendingSheet]);

  // origin은 서버 렌더에서 비어 있다. 그때는 링크를 만들지 않고 마운트 후 채운다.
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const { copyLink } = useInviteShare({
    // 초대 링크를 복사한다. 받은 사람이 참여까지 이어갈 수 있어야 한다.
    shareUrl: toInviteShareUrl(inviteCode, origin),
    // 복사는 보내는 사람 이름을 쓰지 않는다. 문자·카카오 공유에만 필요한 값이다.
    senderNickname: null,
    onNotify: (message) => toast.add({ description: message }),
  });

  const leaveTarget = toLeaveMeetingTarget({
    role,
    meetingId: meeting?.meetingId,
    inviteCode,
    guestNickname,
  });
  const { leave } = useLeaveMeeting(leaveTarget);
  const { deleteIt } = useDeleteMeeting(meeting?.meetingId);

  const currentNickname = useMyMeetingNickname(inviteCode);
  const { submit: submitNickname, isSubmitting } = useEditMeetingNickname({
    meetingId: meeting?.meetingId,
    inviteCode,
    onSuccess: () => setOpenSheet(null),
  });

  const isParticipant = role !== null && role !== 'non-participant';

  /** 그 항목을 지금 실행할 수 있는지. 필요한 식별자가 아직 없으면 열지 않는다. */
  const canRun = (item: MeetingMenuItem): boolean => {
    if (item === 'leave-meeting') return leaveTarget !== null;
    return meeting?.meetingId !== undefined;
  };

  const handleSelect = (item: MeetingMenuItem) => {
    setMenuOpen(false);

    if (item === 'copy-link') {
      void copyLink();
      return;
    }

    // 확인까지 받아 놓고 실패하지 않도록 여기서 멈춘다.
    if (!canRun(item)) {
      toast.add({ description: UNAVAILABLE_MESSAGE });
      return;
    }

    setPendingSheet(item);
  };

  return (
    <>
      <TopAppBar
        className="relative z-20 shrink-0"
        leading={
          isParticipant && (
            <IconButton
              icon="chevron-left"
              aria-label="뒤로가기"
              className="text-white"
              onClick={() => router.back()}
            />
          )
        }
        trailing={
          isParticipant && (
            <IconButton
              icon="kebab"
              aria-label="더보기"
              className="text-white"
              onClick={() => setMenuOpen(true)}
            />
          )
        }
      />

      {isParticipant && (
        <>
          <MeetingMenuDrawer
            role={role}
            open={isMenuOpen}
            onOpenChange={setMenuOpen}
            onSelect={handleSelect}
          />

          <EditMeetingNicknameDrawer
            currentNickname={currentNickname}
            open={openSheet === 'edit-nickname'}
            onOpenChange={(open) => setOpenSheet(open ? 'edit-nickname' : null)}
            isSubmitting={isSubmitting}
            onSubmit={(nickname) => void submitNickname(nickname)}
          />

          <DeleteMeetingDialog
            open={openSheet === 'delete-meeting'}
            onOpenChange={(open) => setOpenSheet(open ? 'delete-meeting' : null)}
            onConfirm={() => void deleteIt()}
          />

          <LeaveMeetingDialog
            open={openSheet === 'leave-meeting'}
            onOpenChange={(open) => setOpenSheet(open ? 'leave-meeting' : null)}
            onConfirm={() => void leave()}
          />
        </>
      )}
    </>
  );
}
