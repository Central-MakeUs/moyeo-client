/**
 * 검색 결과의 표시명. displayName → address 순으로 있는 값을 쓴다.
 * 둘 다 없으면 빈 문자열.
 *
 * 검색 결과의 `displayName`이 선택 필드라 폴백이 필요하다.
 */
export function toPlaceLabel(place: { displayName?: string; address?: string }): string {
  return place.displayName || place.address || '';
}
