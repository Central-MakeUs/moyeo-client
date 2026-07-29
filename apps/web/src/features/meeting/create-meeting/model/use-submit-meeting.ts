'use client';

import * as React from 'react';

import { useMutation } from '@tanstack/react-query';

import { createMeeting, type CreateMeetingResponse } from '@/shared/api';

import { useCreateMeetingDraft } from './create-meeting-draft';
import { toCreateMeetingRequest } from './to-create-meeting-request';

export interface UseSubmitMeetingOptions {
  /** 생성 성공 시 호출된다. 이동은 호출부(페이지)가 정한다. */
  onSuccess: (response: CreateMeetingResponse) => void;
}

/**
 * 위저드 마지막 스텝의 제출.
 *
 * 서버에 `Idempotency-Key`가 없어 중복 생성을 막을 수단이 요청 단에는 없다.
 * 그래서 in-flight 가드로 두 번째 호출 자체를 버린다(spec-fixed §7).
 *
 * ⚠️ 가드를 `isPending`으로 두면 연타를 못 막는다. 한 번 탭한 직후 리렌더 전까지
 * `isPending`은 아직 false라, 같은 프레임에 들어온 두 번째 호출이 그대로 통과한다.
 * 렌더와 무관하게 즉시 바뀌는 ref로 막는다.
 *
 * ⚠️ **여기서 draft를 비우지 않는다.** `router.replace`는 위저드 페이지를 동기적으로
 * 언마운트하지 않아서, 곧바로 reset하면 아직 살아 있는 페이지가 리렌더되고 `useStepGuard`가
 * 빈 draft를 보고 홈으로 되돌려 방금 건 이동을 덮어쓴다. 비우는 일은 위저드를 완전히 벗어난
 * 도착지(CRT-07)가 맡는다.
 *
 * 실패 시 draft는 그대로라 다시 시도할 수 있다.
 */
export function useSubmitMeeting({ onSuccess }: UseSubmitMeetingOptions) {
  const inFlightRef = React.useRef(false); // 제출 요청이 진행 중인지를 담고 있는 플래그

  const mutation = useMutation({
    mutationFn: () => createMeeting(toCreateMeetingRequest(useCreateMeetingDraft.getState())),
    onSuccess,
    onSettled: () => {
      inFlightRef.current = false;
    },
  });

  const { mutate } = mutation;

  return {
    submit: () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      mutate();
    },
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
