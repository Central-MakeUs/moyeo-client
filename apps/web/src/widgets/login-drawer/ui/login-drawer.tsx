import { Suspense } from 'react';

import { SocialLoginButtons } from '@/features/social-login';
import { Drawer, DrawerContent, DrawerBody, Button } from '@/shared/ui';

interface LoginDrawerBaseProps {
  /** 열림 상태. 호출부가 소유한다. */
  isOpen: boolean;
  /** 열림 상태 변경 요청(오버레이 탭, 드래그 등). */
  onOpenChange: (next: boolean) => void;
  /**
   * 제공할 로그인 수단.
   * - `guest` — 소셜 로그인 + 일회성 게스트 참여 (모바일 웹)
   * - `member` — 소셜 로그인만 (앱 WebView 안)
   */
  /**
   * 로그인 후 돌아갈 내부 경로. `SocialLoginButtons`로 그대로 넘긴다.
   * Drawer를 여는 화면의 URL에 `?next=`가 없을 때 쓴다(prd.md ADR-4).
   */
  next?: string | null;
}

export type LoginDrawerProps = LoginDrawerBaseProps &
  (
    | {
        type: 'guest';
        /** 일회성 게스트 참여를 선택했을 때 실행할 동작. */
        onGuestJoin: () => void;
      }
    | {
        type: 'member';
        onGuestJoin?: never;
      }
  );

export function LoginDrawer({ isOpen, onOpenChange, type, next, onGuestJoin }: LoginDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerBody className="flex w-full flex-col gap-3 pt-3 pb-11">
          <Suspense>
            <SocialLoginButtons next={next} />
          </Suspense>

          {type === 'guest' && (
            <>
              <div className="flex w-full items-center gap-2">
                <div className="h-px flex-1 bg-neutral-70" />
                <span className="text-semibold-14 text-neutral-400">OR</span>
                <div className="h-px flex-1 bg-neutral-70" />
              </div>

              <section className="flex w-full flex-col items-center gap-2">
                <Button fullWidth onClick={onGuestJoin}>
                  이번에만 게스트로 참여하기
                </Button>
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
