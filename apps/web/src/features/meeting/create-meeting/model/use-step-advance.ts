'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { nextStep, stepToPath, type StepKey } from './step-config';
import { useStepFlow } from './use-step-flow';
import { useSubmitMeeting } from './use-submit-meeting';

/**
 * 생성 직후 초대 링크 화면(CRT-07). meetingId를 못 받으면 열 수 없다.
 *
 * `inviteCode`를 쿼리로 넘긴다. 공유 링크를 만들 수 있는 값이 생성 응답에만 들어 있어,
 * 넘기지 않으면 CRT-07이 링크를 조립할 수 없다. 쿼리로 두면 새로고침에도 남는다.
 *
 * 서버가 함께 주는 `invitePath`(`/meetings/invitations/{code}`)는 쓰지 않는다. API 리소스
 * 경로라 우리 앱에 없는 경로이고, 공유 링크의 canonical 진입점은 `/i/{inviteCode}`다.
 */
function invitePath(meetingId: number, inviteCode: string | undefined): string {
  const path = `/meetings/${meetingId}/invite`;

  return inviteCode === undefined ? path : `${path}?code=${encodeURIComponent(inviteCode)}`;
}

/**
 * 위저드에서 "다음"을 눌렀을 때 할 일.
 *
 * 다음 스텝이 있으면 이동하고, 없으면(= 마지막 스텝) 제출한다. 어느 스텝이 마지막인지는
 * planningType·scheduleInputType 조합마다 달라서, 세 페이지가 각자 판단하면 분기가 흩어진다.
 */
export function useStepAdvance(step: StepKey) {
  const router = useRouter();
  const flow = useStepFlow();

  // 201인데 meetingId가 없는 경우. 이동도 실패도 아니라 따로 들고 있어야 한다.
  const [hasUnusableResponse, setHasUnusableResponse] = React.useState(false);

  const { submit, isSubmitting, isError } = useSubmitMeeting({
    onSuccess: (response) => {
      // 응답 필드가 전부 optional이다(spec-fixed §7).
      if (response.meetingId === undefined) {
        // 홈으로 보내지 않는다 — 홈에 모임 목록이 없어서, 모임은 만들어졌는데 초대 링크를
        // 다시 찾을 방법이 사라진다. 화면에 남겨 사용자가 상황을 알 수 있게 한다.
        setHasUnusableResponse(true);
        return;
      }

      // 뒤로가기로 제출된 위저드에 돌아오지 않도록 replace로 바꾼다.
      router.replace(invitePath(response.meetingId, response.inviteCode));
    },
  });

  return {
    advance: () => {
      const next = nextStep(step, flow);
      if (next !== null) {
        router.push(stepToPath(next));
        return;
      }

      submit();
    },
    /** 요청 중이거나 성공 후 초대 화면으로 이동 중이면 `true`. */
    isSubmitting,
    /** 제출이 실패했거나, 성공했지만 초대 화면을 열 수 없는 응답을 받았다. */
    isSubmitError: isError || hasUnusableResponse,
  };
}
