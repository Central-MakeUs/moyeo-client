import { dataUrlToBlob } from '@/shared/lib/data-url';
import { COVER_IMAGE_FILE_NAME } from '@/shared/lib/normalize-cover-image';

import type { CreateMeetingRequest, CreateMeetingResponse } from './generated/schemas';

import { customInstance } from './axios-instance';

/**
 * 모임 생성(multipart POST /api/meetings).
 *
 * ⚠️ orval이 만든 `createMeetingWithCover`를 쓰지 않고 직접 조립한다. 생성 코드가 API 문서와
 * 두 군데에서 어긋나기 때문이다(`generated/meeting/meeting.ts` 주석 참고).
 *
 * 1. 문서: "`request`는 문자열이 아니라 `application/json` 타입의 Blob 파트여야 합니다."
 *    생성 코드: `formData.append('request', JSON.stringify(...))` — 문자열 파트라
 *    서버의 `@RequestPart` 객체 바인딩이 실패한다.
 * 2. 문서: "`Content-Type` 헤더는 직접 설정하지 마세요. multipart boundary가 자동으로 붙습니다."
 *    생성 코드: `headers: { 'Content-Type': 'multipart/form-data' }` — boundary가 빠져
 *    서버가 파트를 나누지 못한다.
 *
 * orval은 `clean: true`로 `generated/` 전체를 지우고 다시 만들므로 그쪽을 고쳐도 되돌아간다.
 * 스펙이 고쳐지거나 orval 설정으로 해결되면 이 파일을 지우고 생성 훅으로 돌아가면 된다.
 */
export const CREATE_MEETING_PATH = '/api/meetings';

/**
 * 생성 요청 multipart 본문을 만든다.
 *
 * 전송과 분리한 이유는 검증이다. jsdom은 XHR로 나가는 FormData의 Blob 파트 내용을 보존하지
 * 못해(파트가 `"undefined"` 문자열이 된다) 네트워크 경계에서는 본문을 확인할 수 없다.
 * 조립을 따로 두면 전송 전에 파트 타입과 내용을 그대로 검사할 수 있다.
 *
 * @param request 생성 요청 본문
 * @param coverImage 커버 사진 data URL(CRT-05). 선택 입력이라 없으면 파트를 생략한다.
 */
export function buildCreateMeetingFormData(
  request: CreateMeetingRequest,
  coverImage?: string | null
): FormData {
  const formData = new FormData();

  formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));

  // 문서상 "사진이 없으면 이 파트를 생략합니다" — 빈 파트를 보내면 서버가 파일로 해석한다.
  if (coverImage) {
    formData.append('coverImage', dataUrlToBlob(coverImage), COVER_IMAGE_FILE_NAME);
  }

  return formData;
}

export function createMeeting(
  request: CreateMeetingRequest,
  coverImage?: string | null
): Promise<CreateMeetingResponse> {
  return customInstance<CreateMeetingResponse>({
    url: CREATE_MEETING_PATH,
    method: 'POST',
    data: buildCreateMeetingFormData(request, coverImage),
  });
}
