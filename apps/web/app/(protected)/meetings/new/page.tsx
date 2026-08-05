'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { resolveEntryPath, useCreateMeetingDraft } from '@/features/meeting/create-meeting';

/**
 * 위저드 진입점 resolver. 화면을 그리지 않고 draft 완성도를 보고 알맞은 곳으로 replace 한다.
 * (`replace`인 이유: 진입점이 history에 남으면 뒤로가기가 resolver로 튕긴다)
 *
 * 목적지 계산은 스텝 가드와 공유하는 `resolveEntryPath`가 담당한다.
 */
export default function CreateMeetingResolverPage() {
  const router = useRouter();
  const draft = useCreateMeetingDraft();

  const target = resolveEntryPath(draft);

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return null;
}
