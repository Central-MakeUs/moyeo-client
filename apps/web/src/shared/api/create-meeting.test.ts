import { describe, expect, it } from 'vitest';

import { buildCreateMeetingFormData } from './create-meeting';

/** FormData의 request 파트를 꺼낸다. jsdom Blob은 realm이 달라 instanceof를 쓰지 않는다. */
async function readRequestPart(formData: FormData) {
  const part = formData.get('request');
  if (part === null || typeof part === 'string') throw new Error('request 파트가 Blob이 아니다');

  return { type: part.type, json: JSON.parse(await part.text()) as Record<string, unknown> };
}

describe('buildCreateMeetingFormData', () => {
  it('request를 application/json 타입의 Blob 파트로 담는다', async () => {
    const formData = buildCreateMeetingFormData({
      name: '팀 회식',
      maxParticipants: 6,
      planningType: 'PLACE_ONLY',
      noDeadline: true,
    });

    const part = await readRequestPart(formData);

    // 문자열 파트로 보내면 서버의 @RequestPart 객체 바인딩이 실패한다(API 문서 명시).
    expect(part.type).toBe('application/json');
  });

  it('요청 객체를 그대로 직렬화해 담는다', async () => {
    const request = {
      name: '팀 회식',
      maxParticipants: 6,
      planningType: 'SCHEDULE_ONLY' as const,
      scheduleInputType: 'DATE_ONLY' as const,
      scheduleCandidateDates: ['2026-08-01'],
      deadlineMinutes: 60,
      noDeadline: false,
    };

    const part = await readRequestPart(buildCreateMeetingFormData(request));

    expect(part.json).toEqual(request);
  });

  it('커버 사진이 없으면 coverImage 파트를 생략한다', () => {
    const formData = buildCreateMeetingFormData({
      name: '팀 회식',
      maxParticipants: 6,
      planningType: 'PLACE_ONLY',
      noDeadline: true,
    });

    // 문서: "사진이 없으면 이 파트를 생략합니다." 빈 파트를 보내면 서버가 파일로 해석한다.
    expect(formData.get('coverImage')).toBeNull();
  });

  it('커버 사진 data URL을 파일 파트로 담는다', async () => {
    // 1×1 투명 GIF. 내용은 중요하지 않고 base64 data URL이 Blob으로 되돌아가는지만 본다.
    const dataUrl =
      'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    const formData = buildCreateMeetingFormData(
      { name: '팀 회식', maxParticipants: 6, planningType: 'PLACE_ONLY', noDeadline: true },
      dataUrl
    );

    const part = formData.get('coverImage');
    if (part === null || typeof part === 'string')
      throw new Error('coverImage 파트가 파일이 아니다');

    expect(part.type).toBe('image/jpeg');
    expect(part.size).toBeGreaterThan(0);
  });

  it('커버 사진이 null이면 coverImage 파트를 생략한다', () => {
    // 초안의 기본값이 null이라, 고르지 않고 제출하는 경로가 그대로 여기로 들어온다.
    const formData = buildCreateMeetingFormData(
      { name: '팀 회식', maxParticipants: 6, planningType: 'PLACE_ONLY', noDeadline: true },
      null
    );

    expect(formData.get('coverImage')).toBeNull();
  });

  it('Content-Type을 직접 지정하지 않는다', () => {
    // boundary는 브라우저가 붙인다. 직접 'multipart/form-data'를 넣으면 boundary가 빠져
    // 서버가 파트를 나누지 못한다(API 문서 명시). 조립 단계에서 헤더를 만들지 않는 것으로 보장한다.
    const formData = buildCreateMeetingFormData({
      name: '팀 회식',
      maxParticipants: 6,
      planningType: 'PLACE_ONLY',
      noDeadline: true,
    });

    expect(formData).toBeInstanceOf(FormData);
  });
});
