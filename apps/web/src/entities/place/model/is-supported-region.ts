/** `region_1depth_name` 이 이 중 하나로 시작하면 지원 지역이다. */
const SUPPORTED_REGION_PREFIXES = ['서울', '경기'];

/**
 * 서버가 허용하는 출발지 지역인가 (`departureRequest.ts:22` — 서울특별시·경기도만 허용).
 *
 * 좌표 경계 계산을 하지 않고 `coord2Address` 의 `region_1depth_name` 접두사로만 판정한다 (§7).
 * 판정할 이름이 없으면(`null`) `false` 다 — 통과시켰다가 마지막 제출에서 400을 받는 것보다
 * 여기서 막는 편이 낫다.
 */
export function isSupportedRegion(regionName: string | null): boolean {
  if (regionName === null) return false;

  return SUPPORTED_REGION_PREFIXES.some((prefix) => regionName.startsWith(prefix));
}
