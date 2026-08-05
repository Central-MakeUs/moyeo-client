'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { useBackHandler } from '@/shared/model';
import { IconButton } from '@/shared/ui/icon-button';

export interface BackButtonProps {
  /**
   * 이 화면의 논리적 부모 경로.
   *
   * 주면 브라우저 히스토리 대신 이 경로로 `replace` 한다 — 설정·법적 문서처럼
   * "상위 화면으로 닫는다"가 의미인 화면용이다. 즐겨찾기나 주소 직접 입력으로 들어와
   * 히스토리가 비어 있어도 항상 같은 곳으로 간다.
   *
   * 생략하면 `router.back()`으로 히스토리를 그대로 따른다 — 직전 화면에서 왔다는
   * 전제가 강한 흐름형(위저드·참여 플로우) 화면용이다.
   *
   * `history.length`로 분기하지 않는다. 그 값은 "이전 페이지가 있다"만 알려줄 뿐
   * "그게 어디인지"는 알려주지 않아서, 외부 사이트에서 들어온 경우를 걸러내지 못한다.
   */
  href?: string;
  /** 접근 가능한 이름. 목적지가 분명하면 '마이페이지로 돌아가기'처럼 구체적으로 준다. */
  'aria-label'?: string;
  className?: string;
}

export function BackButton({
  href,
  'aria-label': ariaLabel = '뒤로가기',
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (href === undefined) {
      router.back();
      return;
    }

    // push가 아니라 replace다. push하면 히스토리가 [부모, 자식, 부모]가 되어
    // 그 다음 시스템 back이 방금 닫은 화면으로 되돌아간다.
    router.replace(href);
  }, [href, router]);

  // 네이티브 뒤로가기도 이 버튼과 같은 곳으로 가야 한다. 특히 `href`가 있는 화면은
  // 방문 기록이 아니라 상위 화면으로 닫는 것이 의미라, 네이티브에 맡기면 어긋난다.
  useBackHandler(() => {
    handleBack();
    return true;
  });

  return (
    <IconButton
      icon="chevron-left"
      aria-label={ariaLabel}
      className={className}
      onClick={handleBack}
    />
  );
}
