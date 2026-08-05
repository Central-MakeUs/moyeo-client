'use client';

import * as React from 'react';

import { isValidNickname } from '@/entities/nickname';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui';
import { InputField } from '@/shared/ui/input';

const NICKNAME_HINT = '* 2~10자로 공백없이 한글과 영어만 입력해주세요';

export interface EditMeetingNicknameDrawerProps {
  /** 지금 이 모임에서 쓰는 닉네임. 열릴 때 이 값으로 채운다. 아직 모르면 `null`. */
  currentNickname?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 요청 중이면 완료 버튼을 잠근다. */
  isSubmitting?: boolean;
  /** 규칙을 만족하고, 기존과 다른 닉네임만 넘어온다. */
  onSubmit: (nickname: string) => void;
}

/**
 * 모임별 닉네임 수정 Drawer(VIEW-01-F04).
 *
 * 입력값과 검증만 갖고, 저장은 호출부(`useEditMeetingNickname`)가 한다.
 */
export function EditMeetingNicknameDrawer({
  currentNickname = null,
  open,
  onOpenChange,
  isSubmitting = false,
  onSubmit,
}: EditMeetingNicknameDrawerProps): React.JSX.Element {
  const [value, setValue] = React.useState('');

  // 열릴 때의 값만 본다. 열려 있는 동안 서버 값이 갱신돼도 입력 중인 내용을 덮지 않는다.
  const currentNicknameRef = React.useRef(currentNickname);
  currentNicknameRef.current = currentNickname;

  React.useEffect(() => {
    // 닫힐 때도 비워 둔다. 다음에 열릴 때 이 effect가 다시 채운다.
    setValue(open ? (currentNicknameRef.current ?? '') : '');
  }, [open]);

  const isValid = isValidNickname(value);
  // 아직 아무것도 안 친 상태를 오류로 보여주지 않는다.
  const showError = value.length > 0 && !isValid;
  // 바꾼 게 없으면 보낼 이유가 없다.
  const isChanged = value !== (currentNickname ?? '');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || !isChanged || isSubmitting) return;
    onSubmit(value);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col gap-0">
        <DrawerHeader className="gap-1.5 py-0 pb-6">
          <DrawerTitle className="w-full text-start text-bold-16 text-neutral-900">
            모임별 닉네임 수정
          </DrawerTitle>
        </DrawerHeader>

        {/* 완료 버튼이 footer에 있으므로 form이 body와 footer를 함께 감싼다. */}
        <form onSubmit={handleSubmit}>
          <DrawerBody className="pb-8">
            <InputField
              aria-label="모임별 닉네임"
              placeholder="닉네임을 입력해주세요"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              description={NICKNAME_HINT}
              errorMessage={showError ? NICKNAME_HINT : undefined}
              disabled={isSubmitting}
            />
          </DrawerBody>

          <DrawerFooter className="grid grid-cols-2 gap-2.5 pt-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!isValid || !isChanged}>
              완료
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
