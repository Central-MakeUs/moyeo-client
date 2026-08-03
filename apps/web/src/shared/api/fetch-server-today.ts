import { toServiceDate } from '@/shared/lib/to-service-date';

import type { ServerTimeResponse } from './generated/schemas';

/**
 * Next.js 서버 렌더링에서 서비스 기준 오늘 날짜를 조회합니다.
 *
 * 클라이언트 훅 `useServerToday`와 같은 엔드포인트를 보지만, 화면이 뜬 뒤 조회가 끝나기를
 * 기다리지 않도록 서버에서 미리 가져옵니다. 게스트 참여 화면은 이 값으로 지난 날짜·시간을
 * 비활성화하므로, 값이 늦게 도착하면 그 사이에 지난 칸을 고를 수 있습니다.
 *
 * 날짜 단위로만 쓰이므로 30초 재검증으로 충분합니다. 사용자별 정보가 없어 URL 단위 캐시를
 * 공유해도 안전합니다.
 *
 * @returns 서비스 기준 오늘 'yyyy-MM-dd', 또는 조회·파싱에 실패한 경우 `null`
 */
export async function fetchServerToday(): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/time`, { next: { revalidate: 30 } });
    if (!response.ok) return null;

    const body = (await response.json()) as ServerTimeResponse;

    return toServiceDate(body.serverTime);
  } catch {
    return null;
  }
}
