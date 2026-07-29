'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { nextStep, stepToPath, type StepKey } from './step-config';
import { useStepFlow } from './use-step-flow';
import { useSubmitMeeting } from './use-submit-meeting';

/** 생성 직후 초대 링크 화면. meetingId를 못 받으면 열 수 없다. */
const invitePath = (meetingId: number) => `/meetings/${meetingId}/invite`;

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

  const { submit, isPending, isError } = useSubmitMeeting({
    onSuccess: (response) => {
      // 응답 필드가 전부 optional이다(spec-fixed §7).
      if (response.meetingId === undefined) {
        // 홈으로 보내지 않는다 — 홈에 모임 목록이 없어서, 모임은 만들어졌는데 초대 링크를
        // 다시 찾을 방법이 사라진다. 화면에 남겨 사용자가 상황을 알 수 있게 한다.
        setHasUnusableResponse(true);
        return;
      }

      // 뒤로가기로 제출된 위저드에 돌아오지 않도록 replace로 바꾼다.
      router.replace(invitePath(response.meetingId));
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
    /** 제출 중. CTA를 잠가 연타를 한 번 더 막는다. */
    isSubmitting: isPending,
    /** 제출이 실패했거나, 성공했지만 초대 화면을 열 수 없는 응답을 받았다. */
    isSubmitError: isError || hasUnusableResponse,
  };
}
