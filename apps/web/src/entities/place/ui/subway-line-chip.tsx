import * as React from 'react';

import { getLineColor } from '../model/subway-line-colors';

const NUMBERED_LINE_PATTERN = /^(\d+)호선$/;

export interface SubwayLineChipProps {
  /** 예: "2호선", "경의중앙선" */
  lineName: string;
}

/**
 * 노선 색으로 채운 작은 배지. 숫자 노선("N호선")은 원형에 숫자만, 그 외 노선은 이름 전체를 알약 모양으로 보여준다.
 */
export function SubwayLineChip({ lineName }: SubwayLineChipProps): React.JSX.Element {
  const color = getLineColor(lineName);
  const numberedMatch = lineName.match(NUMBERED_LINE_PATTERN);

  if (numberedMatch) {
    return (
      <span
        className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {numberedMatch[1]}
      </span>
    );
  }

  return (
    <span
      className="inline-flex h-[18px] shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {lineName}
    </span>
  );
}
