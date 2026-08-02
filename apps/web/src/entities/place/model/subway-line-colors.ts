/**
 * 지하철 노선별 대표 색상(hex). 서울교통공사·한국철도공사 공식 노선색 기준.
 * 출처: https://ko.wikipedia.org/wiki/틀:한국_철도_노선색
 * 매핑에 없는 노선(백엔드가 새 노선을 내려주는 경우 등)은 FALLBACK_LINE_COLOR로 표시한다.
 */
export const SUBWAY_LINE_COLORS: Record<string, string> = {
  '1호선': '#0052A4',
  '2호선': '#00A84D',
  '3호선': '#EF7C1C',
  '4호선': '#00A5DE',
  '5호선': '#996CAC',
  '6호선': '#CD7C2F',
  '7호선': '#747F00',
  '8호선': '#E6186C',
  '9호선': '#BDB092',
  경의중앙선: '#77C4A3',
  수인분당선: '#F5A200',
  신분당선: '#D4003B',
  경춘선: '#0C8E72',
  경강선: '#003DA5',
  우이신설선: '#B0CE18',
  신림선: '#6789CA',
  김포골드라인: '#A17800',
  서해선: '#81A914',
  인천1호선: '#7CA8D5',
  인천2호선: '#ED8B00',
};

/** 매핑에 없는 노선용 기본색 (neutral-400 근사치) */
export const FALLBACK_LINE_COLOR = '#9CA3AF';

export function getLineColor(lineName: string): string {
  return SUBWAY_LINE_COLORS[lineName] ?? FALLBACK_LINE_COLOR;
}
