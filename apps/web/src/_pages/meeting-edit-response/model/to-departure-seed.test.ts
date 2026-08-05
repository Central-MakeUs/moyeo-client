import { describe, expect, it } from 'vitest';

import { toDepartureSeed } from './to-departure-seed';

describe('toDepartureSeed', () => {
  it('표시명이 없으면 주소를 이름으로 쓴다 — 이름 없이 참여할 수 있다', () => {
    expect(
      toDepartureSeed({
        name: null,
        address: '서울특별시 마포구 양화로 160',
        transportationMode: 'PUBLIC_TRANSIT',
      })
    ).toEqual({
      departure: {
        name: '서울특별시 마포구 양화로 160',
        address: '서울특별시 마포구 양화로 160',
        latitude: undefined,
        longitude: undefined,
      },
      transportationMode: 'PUBLIC_TRANSIT',
    });
  });

  it('주소가 없으면 고른 출발지로 볼 수 없어 비운다', () => {
    expect(toDepartureSeed({ name: '합정역', transportationMode: 'CAR' })).toEqual({
      departure: null,
      transportationMode: 'CAR',
    });
  });

  it('위치를 조율하지 않는 모임은 채울 값이 없다', () => {
    expect(toDepartureSeed(null)).toEqual({ departure: null, transportationMode: null });
  });

  it('좌표는 그대로 넘긴다 — 검색으로 고른 출발지를 다시 찍게 하지 않는다', () => {
    expect(
      toDepartureSeed({
        name: '합정역',
        address: '서울특별시 마포구 양화로 160',
        latitude: 37.5495,
        longitude: 126.9137,
        transportationMode: 'PUBLIC_TRANSIT',
      }).departure
    ).toMatchObject({ latitude: 37.5495, longitude: 126.9137 });
  });
});
