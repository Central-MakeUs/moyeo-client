import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface WizardStepLayoutProps {
  /** 상단 제목 영역 (보통 PageHeader) */
  header: ReactNode;
  /** 하단 고정 CTA (보통 CTASection) */
  footer: ReactNode;
  /** 본문 */
  children: ReactNode;
  /**
   * 제출이 진행 중인지. 본문에 `aria-busy`를 붙여 스크린리더에 알린다.
   *
   * 입력을 실제로 막는 것은 각 컨트롤의 `disabled`가 한다. 여기서 포인터를 덮지 않는 이유는
   * 본문이 스크롤 영역이라, 덮으면 제출 중에 자기가 무엇을 골랐는지 볼 수 없게 되기 때문이다.
   */
  isSubmitting?: boolean;
  className?: string;
}

/**
 * 위저드 각 스텝의 공통 레이아웃.
 * - 본문: px-5 py-10, header ↔ body 간격 48px(gap-12), 넘치면 스크롤
 * - footer(CTA): 하단 고정. 부모 높이가 h-dvh로 잡혀 있어 키보드가 올라오면 그 위에 남는다
 *   (Android adjustResize / iOS dvh). 실기기 키보드 정책 검증 필요.
 */
export function WizardStepLayout({
  header,
  footer,
  children,
  isSubmitting = false,
  className,
}: WizardStepLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div
        aria-busy={isSubmitting || undefined}
        className={cn('flex flex-1 flex-col gap-12 overflow-y-auto px-5 py-10', className)}
      >
        {header}
        {children}
      </div>
      {footer}
    </div>
  );
}
