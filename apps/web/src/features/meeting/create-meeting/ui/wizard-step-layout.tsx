import type { ReactNode } from 'react';

import { ToastOffsetBoundary } from '@/shared/ui/toast';
import { cn } from '@/shared/lib/cn';

export interface WizardStepLayoutProps {
  /** 상단 제목 영역 (보통 PageHeader) */
  header: ReactNode;
  /** 하단 고정 CTA (보통 CTASection) */
  footer: ReactNode;
  /** 본문 */
  children: ReactNode;
  className?: string;
}

/**
 * 위저드 각 스텝의 공통 레이아웃.
 * - 본문: px-5 py-10, header ↔ body 간격 48px(gap-12), 넘치면 스크롤
 * - footer(CTA): 하단 고정. 부모 높이가 h-dvh로 잡혀 있어 키보드가 올라오면 그 위에 남는다
 *   (Android adjustResize / iOS dvh). 실기기 키보드 정책 검증 필요.
 */
export function WizardStepLayout({ header, footer, children, className }: WizardStepLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex flex-1 flex-col gap-12 overflow-y-auto px-5 py-10', className)}>
        {header}
        {children}
      </div>
      <ToastOffsetBoundary>{footer}</ToastOffsetBoundary>
    </div>
  );
}
