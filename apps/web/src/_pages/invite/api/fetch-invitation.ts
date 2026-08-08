import type { MeetingInvitationResponse } from '@/shared/api';

export type InvitationPageResult =
  | { status: 'success'; invitation: MeetingInvitationResponse }
  | { status: 'not-found' }
  | { status: 'error' };

/**
 * 초대 조회 실패 처리
 * 404만 유효하지 않은 초대로 취급하고, 설정·네트워크·서버 오류는 별도 오류로 남긴다.
 *
 * @param inviteCode URL에 포함된 모임 초대 코드
 */
export async function fetchInvitationResult(inviteCode: string): Promise<InvitationPageResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return { status: 'error' };

  try {
    const response = await fetch(`${baseUrl}/api/meetings/invitations/${inviteCode}`, {
      // 삭제·확정·마감처럼 즉시 반영돼야 하는 상태이므로 성공 응답을 재사용하지 않는다.
      cache: 'no-store',
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
 * Orval의 `getInvitation`과 같은 엔드포인트를 사용하지만, 캐시 전략을 직접 정하기 위해
 * 네이티브 `fetch`로 호출합니다. 실패 종류를 구분할 필요가 없는 호출부를 위해 조회 실패를
 * 모두 `null`로 접습니다. 404와 서버 오류를 갈라야 하면 `fetchInvitationResult`를 씁니다.
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
