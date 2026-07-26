'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCompleteOnboarding } from '@/shared/api';
import { CTASection } from '@/shared/ui/cta-section';
import { InputField } from '@/shared/ui/input';

import { isValidNickname } from '../model/validate-nickname';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';

export function NicknameOnboardingForm() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const { mutate, isPending } = useCompleteOnboarding({
    mutation: {
      onSuccess: () => router.push('/home'),
      // 성공 시에만 이동하므로 실패 시 홈으로 가지 않는다.
      // 실패 안내(토스트)는 에러-UX 후속에서 axios 인터셉터/Query onError로 처리.
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
          onChange={(e) => setValue(e.target.value)}
          description={NICKNAME_HINT}
          errorMessage={showError ? NICKNAME_HINT : undefined}
        />
      </div>
      <div className="mt-auto">
        {/* TODO(디자인): isPending일 때 버튼에 스피너/"제출 중" 같은 진행 피드백 추가 */}
        <CTASection disabled={!isValid || isPending} onClick={handleSubmit}>
          다음
        </CTASection>
      </div>
    </div>
  );
}
