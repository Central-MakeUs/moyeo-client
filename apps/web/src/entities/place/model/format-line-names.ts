const NUMBERED_LINE_PATTERN = /^(\d+)호선$/;

/**
 * 지하철 노선명 목록을 "2·6호선"처럼 표시용 문자열로 합친다.
 * 숫자 노선("N호선")은 하나로 묶어 "호선"을 한 번만 붙이고, 그 외(경의중앙선 등)는 이름을 그대로 이어붙인다.
 * 예: ["2호선","6호선"] → "2·6호선", ["2호선","경의중앙선"] → "2호선·경의중앙선"
 */
export function formatLineNames(lineNames: string[]): string {
  const numbers: string[] = [];
  const others: string[] = [];

  for (const lineName of lineNames) {
    const match = lineName.match(NUMBERED_LINE_PATTERN);
    const digits = match?.[1];
    if (digits) {
      numbers.push(digits);
    } else {
      others.push(lineName);
    }
  }

  const numberedLabel = numbers.length > 0 ? `${numbers.join('·')}호선` : null;

  return [numberedLabel, ...others].filter((label): label is string => label !== null).join('·');
}
