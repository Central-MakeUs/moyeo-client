import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { ToastOffsetBoundary } from '../toast';

export interface CompletionLayoutProps {
  /** 상단 제목 영역. 보통 `PageHeader align="center"`. */
  header: ReactNode;
  /** 220×180 영역에 놓이는 일러스트·아이콘. 크기는 각 화면이 정한다. */
  visual: ReactNode;
  /** 화면마다 다른 하단 영역. 없으면 생략한다. */
  children?: ReactNode;
  /** 하단 고정 CTA. 보통 `CTASection`. */
  footer?: ReactNode;
  /**
   * 남는 여백을 위쪽에 얼마나 줄지의 비율(0~1). 기본 `0.5`(중앙).
   *
   * `0.3`이면 위:아래 여백이 3:7이라 본문이 중앙보다 위에 놓인다. 화면 높이의 고정 비율이
   * 아니라 **남는 여백**의 비율이라, 콘텐츠가 많아 여백이 없으면 0이 되어 그냥 위부터
   * 스크롤된다. 기종별로 값이 깨지지 않는 건 이 때문이다.
   */
  verticalBias?: number;
  /** 배경 등 화면별 스타일. 배경을 어디까지 칠할지는 화면이 정한다(아래 주석 참고). */
  className?: string;
}

/** 0~1 밖의 값이 들어와도 레이아웃이 뒤집히지 않게 자른다. */
function clampBias(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * 완료·안내 화면(CRT-06, CRT-07, INV-01)의 공통 레이아웃.
 *
 * 상단바는 포함하지 않는다 — CRT-06은 위저드 라우트 레이아웃에서 TopAppBar와
 * WizardProgress를 이미 받고, CRT-07은 자기가 직접 렌더한다. 여기에 넣으면 CRT-06에서
 * 이중 렌더된다.
 *
 * 배경(`bg-celebration`)도 넣지 않는다. radial-gradient가 적용된 요소 기준으로 중심이
 * 잡혀서, 화면 전체에 칠할 때와 상단바 아래에만 칠할 때 결과가 달라지기 때문이다.
 * 화면이 `className`으로 지정한다.
 *
 * 세로 정렬은 본문 위아래에 둔 빈 spacer의 `flex-grow` 비율로 잡는다(`verticalBias`).
 * 남는 여백만 나눠 가지므로 콘텐츠가 넘치면 spacer가 0으로 접히고 위부터 정상 스크롤된다.
 * `justify-center`를 쓰면 넘칠 때 위쪽이 잘려 스크롤로도 닿지 못한다.
 */
export function CompletionLayout({
  header,
  visual,
  children,
  footer,
  verticalBias = 0.5,
  className,
}: CompletionLayoutProps) {
  const topRatio = clampBias(verticalBias);

  // 비율은 런타임 값이라 Tailwind가 클래스를 추출할 수 없다. 인라인 style로 넘긴다.
  // grow 합이 1 미만이면 남는 여백이 다 분배되지 않으므로 100을 곱해 키운다.
  const spacerStyle = { flexGrow: topRatio * 100 };
  const bottomSpacerStyle = { flexGrow: (1 - topRatio) * 100 };

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-10">
        <div aria-hidden="true" style={spacerStyle} />

        {/*
          요소 간격은 gap-16(64px) 고정이다. flex-1이나 justify-between을 붙이면 본문이
          늘어나면서 간격이 64px보다 벌어지고, spacer의 verticalBias와도 경쟁한다.
        */}
        <div className="flex w-full shrink-0 flex-col items-center gap-16">
          {header}

          <div
            className="flex h-[180px] w-[220px] shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            {visual}
          </div>

          {children}
        </div>

        <div aria-hidden="true" style={bottomSpacerStyle} />
      </main>

      {footer !== undefined && <ToastOffsetBoundary>{footer}</ToastOffsetBoundary>}
    </div>
  );
}
