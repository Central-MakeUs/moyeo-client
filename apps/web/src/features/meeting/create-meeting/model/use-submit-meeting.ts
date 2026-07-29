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
 * 성공하면 draft를 비운다 — 실패 시에는 보존해서 다시 시도할 수 있게 둔다.
 */
export function useSubmitMeeting({ onSuccess }: UseSubmitMeetingOptions) {
  const reset = useCreateMeetingDraft((s) => s.reset);
  const inFlightRef = React.useRef(false); // 제출 요청이 진행 중인지를 담고 있는 플래그

  const mutation = useMutation({
    mutationFn: () => createMeeting(toCreateMeetingRequest(useCreateMeetingDraft.getState())),
    onSuccess: (response) => {
      // reset이 먼저면 이동 전에 가드가 draft를 비었다고 보고 되돌린다. 순서를 바꾸지 말 것.
      onSuccess(response);
      reset();
    },
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
