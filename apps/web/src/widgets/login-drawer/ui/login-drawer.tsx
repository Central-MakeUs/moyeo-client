import { SocialLoginButtons } from '@/features/social-login';
import { Drawer, DrawerContent, DrawerBody, Button } from '@/shared/ui';
import React from 'react';

export interface LoginDrawerProps {
  /** 열림 상태. 호출부가 소유한다. */
  isOpen: boolean;
  /** 열림 상태 변경 요청(오버레이 탭, 드래그 등). */
  onOpenChange: (next: boolean) => void;
  /**
   * 제공할 로그인 수단.
   * - `guest` — 소셜 로그인 + 일회성 게스트 참여 (모바일 웹)
   * - `member` — 소셜 로그인만 (앱 WebView 안)
   */
  type: 'guest' | 'member';
}

export function LoginDrawer({ isOpen, onOpenChange, type }: LoginDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerBody className="flex w-full flex-col gap-3 pt-3 pb-11">
          <SocialLoginButtons />

          {type === 'guest' && (
            <>
              <div className="flex w-full items-center gap-2">
                <div className="h-px flex-1 bg-neutral-70" />
                <span className="text-semibold-14 text-neutral-400">OR</span>
                <div className="h-px flex-1 bg-neutral-70" />
              </div>

              <section className="flex w-full flex-col items-center gap-2">
                <Button fullWidth>이번에만 게스트로 참여하기</Button>
                <p className="text-medium-12 text-neutral-400">
                  게스트는 초대받은 모임에만 참여할 수 있어요
                </p>
              </section>
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
