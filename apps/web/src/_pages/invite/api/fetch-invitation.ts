import type { MeetingInvitationResponse } from '@/shared/api';

export type InvitationPageResult =
  | { status: 'success'; invitation: MeetingInvitationResponse }
  | { status: 'not-found' }
  | { status: 'error' };

/**
 * 초대 조회 실패 처리
 * 404만 유효하지 않은 초대로 취급하고, 설정·네트워크·서버 오류는 별도 오류로 남긴다.
 */
export async function fetchInvitationResult(inviteCode: string): Promise<InvitationPageResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return { status: 'error' };

  try {
    const response = await fetch(`${baseUrl}/api/meetings/invitations/${inviteCode}`, {
      next: { revalidate: 60 },
    });

    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) return { status: 'error' };

    return {
      status: 'success',
      invitation: (await response.json()) as MeetingInvitationResponse,
    };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Next.js 서버 렌더링에서 공개 초대 정보를 조회합니다.
 *
 * Orval의 `getInvitation`과 같은 엔드포인트를 사용하지만, Next.js의 요청 캐시와
 * 60초 재검증을 적용하기 위해 네이티브 `fetch`로 호출합니다. 환경 변수 누락이나
 * 네트워크·HTTP 오류가 발생하면 페이지가 기본 UI로 폴백할 수 있도록 `null`을 반환합니다.
 *
 * @param inviteCode URL에 포함된 모임 초대 코드
 * @returns 조회된 초대 정보, 또는 조회할 수 없는 경우 `null`
 */
export async function fetchInvitationOrNull(
  inviteCode: string
): Promise<MeetingInvitationResponse | null> {
  const result = await fetchInvitationResult(inviteCode);
  return result.status === 'success' ? result.invitation : null;
}
