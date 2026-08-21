'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { IconButton } from '@/shared/ui/icon-button';
import { PageHeader, PageHeaderSkeleton } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';
import { TopAppBar } from '@/shared/ui/top-app-bar';

const ERROR_MESSAGE = '내 응답을 불러오지 못했어요';
const LOADING_LABEL = '내 응답을 불러오는 중';

export interface EditResponseLayoutProps {
  /** 뒤로가기. 화면을 닫는 방법은 `useCloseEditScreen`이 정한다. */
  onBack: () => void;
  /** 없으면 제목·본문 없이 상단바만 그린다. 불러오는 중이거나 실패했을 때. */
  title?: string;
  description?: string;
  /** 시간표처럼 본문이 화면 높이를 꽉 채우고 그 안에서만 스크롤되는 경우. */
  isScrollLocked?: boolean;
  isSaveDisabled?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  /**
   * 조회 중인지. 제목과 CTA 자리를 자리표시자로 채운다.
   *
   * 본문이 무엇인지는 여기서 정하지 않는다 — 화면마다 다르므로 `children`으로 받는다.
   */
  isLoading?: boolean;
  isError?: boolean;
  /** 고칠 수 없는 상태를 알리는 문구. 있으면 본문 대신 이것만 그린다. */
  notice?: string;
  children?: React.ReactNode;
}

/**
 * 응답 수정 화면들의 공통 껍데기 — 뒤로가기 상단바, 제목, 본문, "수정 완료" 버튼.
 *
 * 캘린더·시간표·출발지 세 화면이 안쪽 입력 위젯만 다르고 나머지가 같다. 참여 플로우와 달리
 * 진행 표시가 없다 — 수정은 한 단계라 이어질 다음 화면이 없다.
 */
export function EditResponseLayout({
  onBack,
  title,
  description,
  isScrollLocked = false,
  isSaveDisabled = false,
  isSaving = false,
  onSave,
  isLoading = false,
  isError = false,
  notice,
  children,
}: EditResponseLayoutProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex flex-col bg-white',
        isScrollLocked ? 'h-dvh overflow-hidden' : 'min-h-dvh'
      )}
    >
      <TopAppBar
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onBack} />}
      />

      {/* 좌우 여백은 본문이 통째로 갖는다 — 헤더와 내용이 같은 선에 맞는다(WizardStepLayout과 동일). */}
      {/* 뒤로가기까지 live region에 들어가지 않도록 로딩 상태는 상단바 밖에서 알린다. */}
      <main
        role={isLoading ? 'status' : undefined}
        aria-label={isLoading ? LOADING_LABEL : undefined}
        className={cn(
          'flex flex-1 flex-col gap-12 px-5',
          isScrollLocked && 'min-h-0 overflow-hidden pb-10'
        )}
      >
        {isLoading && <PageHeaderSkeleton className="pt-10" />}
        {!isLoading && title && (
          <PageHeader className="pt-10" title={title} description={description} />
        )}

        {isError && (
          <p className="pt-8 text-center text-medium-14 text-neutral-400">{ERROR_MESSAGE}</p>
        )}
        {notice && <p className="pt-8 text-center text-medium-14 text-neutral-400">{notice}</p>}

        {children}
      </main>

      {/* 자리표시자도 같은 CTASection에 담는다 — 여백·radius가 바뀌면 함께 따라온다. */}
      {isLoading ? (
        <CTASection primaryAction={<Skeleton className="h-12 w-full" />} />
      ) : onSave ? (
        <CTASection
          primaryAction={
            <Button fullWidth disabled={isSaveDisabled} isLoading={isSaving} onClick={onSave}>
              수정 완료
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
