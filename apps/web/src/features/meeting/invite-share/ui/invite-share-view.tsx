'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { CTASection, ToastOffsetBoundary } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { PageHeader } from '@/shared/ui/page-header';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface InviteShareViewProps {
  /**
   * 공유할 절대 URL. `inviteCode`가 없어 링크를 만들 수 없으면 `null`이다.
   * 이때 링크 표시와 공유·복사 버튼을 비활성화한다(crt-07.md §7 F02).
   */
  shareUrl: string | null;
  /** SMS 공유. */
  onShareSms: () => void;
  /** 카카오톡 공유. */
  onShareKakao: () => void;
  /** 링크 복사. 성공 토스트는 호출부가 띄운다. */
  onCopyLink: () => void;
  /** 홈으로 이동. */
  onGoHome: () => void;
  /** 뒤로가기. */
  onBack: () => void;
}

/**
 * CRT-07 링크 생성 완료 화면.
 *
 * 생성 결과를 받아 보여주기만 한다. 값을 어디서 얻는지(쿼리·응답)와 공유 수단의 구현은
 * 호출부가 정한다 — 모임장 생성 직후와 다른 진입점에서 같은 화면을 쓸 수 있게 하기 위함이다.
 */
export function InviteShareView({
  shareUrl,
  onShareSms,
  onShareKakao,
  onCopyLink,
  onGoHome,
  onBack,
}: InviteShareViewProps): React.JSX.Element {
  const canShare = shareUrl !== null;

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onBack} />}
      />

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pb-10">
        <div className="flex h-fit w-full flex-col items-center justify-center gap-16">
          <PageHeader
            align="center"
            title="초대장을 만들었어요!"
            description="함께하고 싶은 친구들에게 초대장을 보내주세요"
          />

          <div className="flex h-[180px] items-center justify-center" aria-hidden="true">
            <Icon name="plane" className="size-[75px]" />
          </div>

          <section className="flex w-full flex-col gap-9">
            <div className="flex w-full shrink-0 items-center gap-1.5 rounded-12 border border-accessible-100 bg-accessible-50 px-4 py-3">
              <Icon name="link" className="size-6 shrink-0 text-accessible-400" />
              {canShare ? (
                <span className="truncate text-semibold-16 text-accessible-400">{shareUrl}</span>
              ) : (
                <span className="truncate text-semibold-16 text-neutral-400">
                  링크를 불러오지 못했어요
                </span>
              )}
            </div>

            <div className="grid shrink-0 grid-cols-3">
              <ShareAction
                label="SMS"
                disabled={!canShare}
                onClick={onShareSms}
                className="bg-neutral-50 text-neutral-600"
              >
                <Icon name="envelope" className="size-8" />
              </ShareAction>

              <ShareAction
                label="카카오톡"
                disabled={!canShare}
                onClick={onShareKakao}
                className="bg-[#FEE500] text-black"
              >
                <Icon name="kakao-text" className="h-fit w-[26px] shrink-0" />
              </ShareAction>

              <ShareAction
                label="URL 복사"
                disabled={!canShare}
                onClick={onCopyLink}
                className="bg-neutral-20 text-neutral-400"
              >
                <Icon name="link" className="size-8" />
              </ShareAction>
            </div>
          </section>
        </div>
      </main>

      <ToastOffsetBoundary>
        <CTASection onClick={onGoHome}>홈으로 돌아가기</CTASection>
      </ToastOffsetBoundary>
    </div>
  );
}

interface ShareActionProps extends React.PropsWithChildren {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className: string;
}

function ShareAction({ label, disabled, onClick, className, children }: ShareActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 outline-none disabled:opacity-40"
    >
      <span
        className={cn(
          'flex size-14 size-[50px] items-center justify-center rounded-full px-[9px]',
          className
        )}
        aria-hidden="true"
      >
        {children}
      </span>
      <span className="text-medium-12 text-black">{label}</span>
    </button>
  );
}
