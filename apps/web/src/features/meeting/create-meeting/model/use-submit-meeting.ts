'use client';

import * as React from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createMeeting, getGetMyMeetingsQueryKey, type CreateMeetingResponse } from '@/shared/api';
import { useSubmissionLock } from '@/shared/model';

import { useCreateMeetingDraft } from './create-meeting-draft';
import { toCreateMeetingRequest } from './to-create-meeting-request';

/**
 * 🚧 마감 기한 스텝(CRT-04) 임시 비활성화 동안 제출에 덮어씌우는 값.
 *
 * 서버는 `noDeadline`이 false/생략이면 `deadlineMinutes`를 필수로 본다. 스텝이 흐름에서 빠진
 * 지금 draft에는 마감이 영영 채워지지 않으므로, 여기서 덮지 않으면 생성 요청이 계약 위반이 된다.
 * 배포 전에 시작해 sessionStorage에 남아 있던 draft(마감 값이 있거나 비어 있는 둘 다)도
 * 이 한 곳을 지나므로 함께 정리된다.
 *
 * → 재활성화하면 이 상수와 아래 mutationFn의 스프레드를 지우면 된다.
 */
const NO_DEADLINE = { noDeadline: true, deadlineMinutes: null } as const;

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
 * 요청이 성공해도 잠금은 풀지 않는다. `router.replace`를 호출한 뒤 기존 화면이 잠시 남을 수
 * 있어, 네트워크 요청이 끝난 시점에 잠금을 풀면 같은 모임을 다시 생성할 수 있다. 실패한
 * 경우에만 잠금을 풀고, 성공한 경우에는 화면 전환으로 훅이 언마운트될 때까지 유지한다.
 *
 * ⚠️ **여기서 draft를 비우지 않는다.** `router.replace`는 위저드 페이지를 동기적으로
 * 언마운트하지 않아서, 곧바로 reset하면 아직 살아 있는 페이지가 리렌더되고 `useStepGuard`가
 * 빈 draft를 보고 홈으로 되돌려 방금 건 이동을 덮어쓴다. 비우는 일은 위저드를 완전히 벗어난
 * 도착지(CRT-07)가 맡는다.
 *
 * 실패 시 draft는 그대로라 다시 시도할 수 있다.
 */
export function useSubmitMeeting({ onSuccess }: UseSubmitMeetingOptions) {
  const queryClient = useQueryClient();
  const isSubmissionLockedRef = React.useRef(false);
  const hasCreatedMeetingRef = React.useRef(false);

  const { lock, unlock } = useSubmissionLock.getState();

  React.useEffect(() => {
    return () => unlock();
  }, [unlock]);

  const mutation = useMutation({
    mutationFn: () => {
      const draft = { ...useCreateMeetingDraft.getState(), ...NO_DEADLINE };

      // 커버 사진은 요청 본문이 아니라 별도 multipart 파트다(CRT-05).
      return createMeeting(toCreateMeetingRequest(draft), draft.coverImage);
    },
    onSuccess: (response) => {
      // 서버 생성이 끝난 뒤의 화면 처리에서 예외가 나도 동일 모임을 다시 제출하면 안 된다.
      hasCreatedMeetingRef.current = true;

      // 방금 만든 모임이 홈 목록에 나타나야 한다. 목록에는 기본 staleTime(60초) 동안 이전
      // 응답이 남아 있어, 비우지 않으면 만든 직후 홈에 갔을 때 새 모임이 빠진 목록을 본다.
      void queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });

      onSuccess(response);
    },
    onError: () => {
      if (hasCreatedMeetingRef.current) return;

      // 화면에 머물러 재시도할 수 있는 실패에서만 잠금을 해제한다.
      isSubmissionLockedRef.current = false;
      unlock();
    },
  });

  const { mutate } = mutation;

  return {
    submit: () => {
      if (isSubmissionLockedRef.current) return;
      isSubmissionLockedRef.current = true;
      lock();
      mutate();
    },
    /** 현재 화면에서 다시 제출할 수 없으면 `true`. 성공 후 화면 전환 중인 상태를 포함한다. */
    isSubmitting: mutation.isPending || mutation.isSuccess || hasCreatedMeetingRef.current,
    isError: mutation.isError,
    error: mutation.error,
  };
}
