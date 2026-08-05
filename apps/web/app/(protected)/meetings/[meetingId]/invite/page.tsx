'use client';

import * as React from 'react';

import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';

import { useSession } from '@/entities/session';
import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';
import {
  initKakao,
  InviteShareView,
  KAKAO_SDK_URL,
  toInviteShareUrl,
  useInviteShare,
} from '@/features/meeting/invite-share';
import { toast } from '@/shared/ui/toast';

/** 생성 응답의 초대 코드를 받는 쿼리 파라미터(crt-07.md §5). */
const INVITE_CODE_PARAM = 'code';
const HOME_PATH = '/home';

export default function MeetingInvitePage() {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <InviteShareRoute />
    </React.Suspense>
  );
}

function InviteShareRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();

  const reset = useCreateMeetingDraft((s) => s.reset);

  /**
   * 생성 플로우의 끝이라 여기서 draft를 비운다. 제출 훅에서 비우면 `router.replace` 직후
   * 아직 살아 있는 위저드 페이지가 리렌더되고, 가드가 빈 draft를 보고 홈으로 되돌려
   * 이 화면으로의 이동을 덮어쓴다(spec-fixed §7).
   */
  React.useEffect(() => {
    reset();
  }, [reset]);

  // origin은 서버 렌더에서 비어 있다. 그때는 링크를 만들지 않고 마운트 후 채운다.
  const [origin, setOrigin] = React.useState('');
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteCode = searchParams.get(INVITE_CODE_PARAM) ?? undefined;
  const shareUrl = toInviteShareUrl(inviteCode, origin);
  const senderNickname = session.status === 'authenticated' ? session.viewer.nickname : null;

  const { copyLink, shareSms, shareKakao } = useInviteShare({
    shareUrl,
    senderNickname,
    onNotify: (message) => toast.add({ description: message }),
  });

  return (
    <>
      <Script src={KAKAO_SDK_URL} onLoad={initKakao} />
      <InviteShareView
        shareUrl={shareUrl}
        onShareSms={shareSms}
        onShareKakao={shareKakao}
        onCopyLink={() => void copyLink()}
        onGoHome={() => router.replace(HOME_PATH)}
        // TODO(crt-07.md §9-4): 유형별 뒤로가기 목적지가 기획 확정 전이라 홈으로 보낸다.
        onBack={() => router.replace(HOME_PATH)}
      />
    </>
  );
}
