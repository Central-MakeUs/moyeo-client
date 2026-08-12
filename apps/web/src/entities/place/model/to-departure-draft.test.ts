import { describe, expect, it } from 'vitest';

import type { ReverseGeocodingResponse } from '@/shared/api';

import { toDepartureDraft } from './to-departure-draft';

/** 핀 좌표. 현재 좌표와 갈라진 뒤의 값을 쓴다. */
const PIN = { latitude: 37.57, longitude: 126.98 };

const detailsOf = (overrides: Partial<ReverseGeocodingResponse>): ReverseGeocodingResponse => ({
  roadAddress: null,
  jibunAddress: null,
  isSupportedRegion: false,
  ...overrides,
});

describe('toDepartureDraft', () => {
  it('roadAddress가 "서울특별시 중구 세종대로 110"이면 name과 address가 모두 그 값이고 좌표는 넘긴 핀 좌표다', () => {
    const result = toDepartureDraft(
      detailsOf({
        roadAddress: '서울특별시 중구 세종대로 110',
        jibunAddress: '서울 중구 태평로1가 31',
        isSupportedRegion: true,
      }),
      PIN
    );

    expect(result).toEqual({
      name: '서울특별시 중구 세종대로 110',
      address: '서울특별시 중구 세종대로 110',
      latitude: 37.57,
      longitude: 126.98,
    });
  });

  it('roadAddress가 null이고 jibunAddress가 "서울 중구 태평로1가 31"이면 name이 지번 주소가 된다', () => {
    const result = toDepartureDraft(
      detailsOf({ jibunAddress: '서울 중구 태평로1가 31', isSupportedRegion: true }),
      PIN
    );

    expect(result?.name).toBe('서울 중구 태평로1가 31');
    expect(result?.address).toBe('서울 중구 태평로1가 31');
  });

  it('roadAddress와 jibunAddress가 모두 없으면 null을 반환한다', () => {
    // 확정 주소가 아니므로 CTA 활성 조건을 만족하지 않는다 (§6-2).
    expect(toDepartureDraft(detailsOf({}), PIN)).toBeNull();
  });
});
