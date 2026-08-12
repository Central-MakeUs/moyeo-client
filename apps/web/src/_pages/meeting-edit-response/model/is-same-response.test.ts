import { describe, expect, it } from 'vitest';

import { isSameDates, isSameDeparture, isSameTimeRanges } from './is-same-response';

describe('isSameDates', () => {
  it('고른 순서가 달라도 같은 날짜들이면 같다', () => {
    expect(isSameDates(['2026-08-12', '2026-08-13'], ['2026-08-13', '2026-08-12'])).toBe(true);
  });

  it('날짜를 하나 더 고르면 다르다', () => {
    expect(isSameDates(['2026-08-12'], ['2026-08-12', '2026-08-13'])).toBe(false);
  });

  it('고르던 날짜를 빼면 다르다', () => {
    expect(isSameDates(['2026-08-12', '2026-08-13'], ['2026-08-12'])).toBe(false);
  });

  it('골랐다가 다시 풀어 원래대로 오면 같다', () => {
    expect(isSameDates(['2026-08-12'], ['2026-08-12'])).toBe(true);
  });

  it('둘 다 비어 있으면 같다', () => {
    expect(isSameDates([], [])).toBe(true);
  });
});

describe('isSameTimeRanges', () => {
  const original = [{ candidateDate: '2026-08-12', startTime: '10:00', endTime: '12:00' }];

  it('쪼개진 구간이어도 덮는 시간대가 같으면 같다 — 서버는 붙여서 준다', () => {
    expect(
      isSameTimeRanges(original, [
        { candidateDate: '2026-08-12', startTime: '10:00', endTime: '11:00' },
        { candidateDate: '2026-08-12', startTime: '11:00', endTime: '12:00' },
      ])
    ).toBe(true);
  });

  it('한 시간이 늘어나면 다르다', () => {
    expect(
      isSameTimeRanges(original, [
        { candidateDate: '2026-08-12', startTime: '10:00', endTime: '13:00' },
      ])
    ).toBe(false);
  });

  it('같은 시간대라도 날짜가 다르면 다르다', () => {
    expect(
      isSameTimeRanges(original, [
        { candidateDate: '2026-08-13', startTime: '10:00', endTime: '12:00' },
      ])
    ).toBe(false);
  });

  it('전부 지우면 다르다', () => {
    expect(isSameTimeRanges(original, [])).toBe(false);
  });
});

describe('isSameDeparture', () => {
  const original = {
    departure: {
      name: '합정역',
      address: '서울특별시 마포구 양화로 160',
      latitude: 37.5495,
      longitude: 126.9137,
    },
    transportationMode: 'PUBLIC_TRANSIT' as const,
  };

  it('출발지와 이동수단이 그대로면 같다', () => {
    expect(isSameDeparture(original, { ...original, departure: { ...original.departure } })).toBe(
      true
    );
  });

  it('이동수단만 바꿔도 다르다', () => {
    expect(isSameDeparture(original, { ...original, transportationMode: 'CAR' })).toBe(false);
  });

  it('다른 장소를 고르면 다르다', () => {
    expect(
      isSameDeparture(original, {
        ...original,
        departure: {
          name: '홍대입구역',
          address: '서울특별시 마포구 양화로 188',
          latitude: 37.5572,
          longitude: 126.9245,
        },
      })
    ).toBe(false);
  });

  it('이름만 같고 좌표가 붙으면 다르다 — 좌표 없이 저장돼 있던 응답을 다시 고른 경우', () => {
    const withoutCoords = {
      ...original,
      departure: { name: '합정역', address: '서울특별시 마포구 양화로 160' },
    };

    expect(isSameDeparture(withoutCoords, original)).toBe(false);
  });

  it('출발지가 비어 있다가 채워지면 다르다', () => {
    expect(isSameDeparture({ ...original, departure: null }, original)).toBe(false);
  });

  it('양쪽 다 비어 있으면 같다', () => {
    expect(
      isSameDeparture(
        { departure: null, transportationMode: null },
        { departure: null, transportationMode: null }
      )
    ).toBe(true);
  });
});
