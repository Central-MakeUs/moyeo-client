'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { NEXT_PARAM, toSafeNextPath } from '@/entities/session';
import { getMeQueryKey, useCompleteOnboarding } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { InputField } from '@/shared/ui/input';

import { isValidNickname } from '../model/validate-nickname';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';
/** `next`가 없거나 외부 주소면 여기로 보낸다. 온보딩 직후의 기본 목적지다. */
const DEFAULT_ONBOARDED_PATH = '/home';

export function NicknameOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');

  // 초대 링크로 들어온 신규 가입자가 온보딩을 마치고 초대장을 잃지 않게 한다(prd.md ADR-4).
  const nextPath = toSafeNextPath(searchParams.get(NEXT_PARAM)) ?? DEFAULT_ONBOARDED_PATH;

  const { mutate, isPending } = useCompleteOnboarding({
    mutation: {
      onSuccess: (user) => {
        // 보호 라우트 가드가 완료 전 사용자 캐시를 다시 읽지 않도록 응답으로 즉시 갱신한다.
        queryClient.setQueryData(getMeQueryKey(), user);
        router.replace(nextPath);
      },
      // 실패 안내는 공통 API 오류 UX와 함께 후속 적용한다.
    },
  });

  const isValid = isValidNickname(value);
  const showError = value.length > 0 && !isValid;

  const handleSubmit = () => {
    if (!isValid || isPending) return;
    mutate({ data: { nickname: value } });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5">
        <InputField
          label="내 닉네임"
          placeholder="기본 닉네임"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          description={NICKNAME_HINT}
          errorMessage={showError ? NICKNAME_HINT : undefined}
        />
      </div>
      <div className="mt-auto">
        <CTASection
          primaryAction={
            <Button fullWidth disabled={!isValid || isPending} onClick={handleSubmit}>
              다음
            </Button>
          }
        />
      </div>
    </div>
  );
}
