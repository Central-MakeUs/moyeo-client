'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { getMeQueryKey, useCompleteOnboarding } from '@/shared/api';
import { CTASection } from '@/shared/ui/cta-section';
import { InputField } from '@/shared/ui/input';

import { isValidNickname } from '../model/validate-nickname';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';

export function NicknameOnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');

  const { mutate, isPending } = useCompleteOnboarding({
    mutation: {
      onSuccess: (user) => {
        // 보호 라우트 가드가 완료 전 사용자 캐시를 다시 읽지 않도록 응답으로 즉시 갱신한다.
        queryClient.setQueryData(getMeQueryKey(), user);
        router.replace('/home');
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
        <CTASection disabled={!isValid || isPending} onClick={handleSubmit}>
          다음
        </CTASection>
      </div>
    </div>
  );
}
