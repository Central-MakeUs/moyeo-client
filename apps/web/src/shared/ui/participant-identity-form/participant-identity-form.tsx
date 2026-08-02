import type { ReactNode } from 'react';

import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { InputField } from '@/shared/ui/input';

export interface ParticipantIdentityFormProps {
  nickname: string;
  nicknameLabel: ReactNode;
  nicknamePlaceholder?: string;
  nicknameDescription?: string;
  nicknameErrorMessage?: string;
  submitLabel: ReactNode;
  submitDescription?: ReactNode;
  isSubmitDisabled?: boolean;
  children?: ReactNode;
  onNicknameChange: (nickname: string) => void;
  onSubmit: () => void;
}

/**
 * 참여자 식별 정보를 입력받는 공통 폼 UI입니다.
 *
 * 닉네임 입력과 하단 CTA의 배치만 담당하며, 검증·API 요청·화면 이동 같은
 * 플로우별 동작은 사용하는 쪽에서 처리합니다. 게스트 비밀번호처럼 특정
 * 플로우에만 필요한 입력은 `children`으로 추가할 수 있습니다.
 */
export function ParticipantIdentityForm({
  nickname,
  nicknameLabel,
  nicknamePlaceholder,
  nicknameDescription,
  nicknameErrorMessage,
  submitLabel,
  submitDescription,
  isSubmitDisabled = false,
  children,
  onNicknameChange,
  onSubmit,
}: ParticipantIdentityFormProps) {
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-3 px-5">
        <InputField
          label={nicknameLabel}
          placeholder={nicknamePlaceholder}
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          description={nicknameDescription}
          errorMessage={nicknameErrorMessage}
        />
        {children}
      </div>
      <div className="mt-auto">
        <CTASection
          className="gap-3"
          secondaryAction={submitDescription}
          primaryAction={
            <Button type="submit" fullWidth disabled={isSubmitDisabled}>
              {submitLabel}
            </Button>
          }
        />
      </div>
    </form>
  );
}
