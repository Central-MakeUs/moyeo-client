import { describe, it, expect } from 'vitest';

import { buildTimeRows } from './build-time-rows';

describe('buildTimeRows', () => {
  it("should return ['17:00','18:00','19:00','20:00','21:00','22:00'] when range is '17:00' to '23:00'", () => {
    expect(buildTimeRows('17:00', '23:00')).toEqual([
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
    ]);
  });

  it("should return ['09:00'] when range is '09:00' to '10:00'", () => {
    expect(buildTimeRows('09:00', '10:00')).toEqual(['09:00']);
  });

  it("should return [] when start and end are both '09:00'", () => {
    expect(buildTimeRows('09:00', '09:00')).toEqual([]);
  });

  it("should return [] when end '09:00' is earlier than start '18:00'", () => {
    expect(buildTimeRows('18:00', '09:00')).toEqual([]);
  });

  it("should return 23 rows when range is '00:00' to '23:00'", () => {
    expect(buildTimeRows('00:00', '23:00')).toHaveLength(23);
  });

  it("should return [] when start is 'abc'", () => {
    expect(buildTimeRows('abc', '10:00')).toEqual([]);
  });

  // 서버는 초대 조회 응답에서 시각을 'HH:mm:ss'로 내려준다. 이걸 거르면 행이 하나도 안 생겨
  // 게스트 시간표가 날짜 헤더만 남은 채 빈 화면으로 보인다.
  it("'10:00:00'~'13:00:00'을 넘기면 ['10:00','11:00','12:00']을 반환한다", () => {
    expect(buildTimeRows('10:00:00', '13:00:00')).toEqual(['10:00', '11:00', '12:00']);
  });

  it("'10:00'과 '13:00:00'처럼 형식이 섞여도 3개 행을 반환한다", () => {
    expect(buildTimeRows('10:00', '13:00:00')).toHaveLength(3);
  });

  it("초가 범위를 벗어난 '10:00:60'을 넘기면 []을 반환한다", () => {
    expect(buildTimeRows('10:00:60', '13:00')).toEqual([]);
  });
});
