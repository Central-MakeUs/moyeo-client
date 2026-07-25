'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { putOnboarding } from '@/entities/auth';
import { CTASection } from '@/shared/ui/cta-section';
import { InputField } from '@/shared/ui/input';

import { isValidNickname } from '../model/validate-nickname';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';

export function NicknameOnboardingForm() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = isValidNickname(value);
  const showError = value.length > 0 && !isValid;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await putOnboarding({ nickname: value });
      router.push('/home');
    } catch {
      // 실패 시 홈 이동하지 않고 재시도 가능 상태로 되돌린다.
      // (실패 안내 문구는 에러-UX 후속(토스트)에서 처리)
      setIsSubmitting(false);
    }
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
        <CTASection disabled={!isValid || isSubmitting} onClick={handleSubmit}>
          다음
        </CTASection>
      </div>
    </div>
  );
}
