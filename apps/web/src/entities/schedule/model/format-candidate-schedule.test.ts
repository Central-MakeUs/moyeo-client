import { describe, expect, it } from 'vitest';

import {
  formatCandidateDate,
  formatCandidateDuration,
  formatCandidateTimeRange,
  formatConfirmedMeetingDate,
  formatConfirmedSchedule,
} from './format-candidate-schedule';

describe('formatConfirmedMeetingDate', () => {
  it('연도까지 적고 시작 시각을 시 단위로 붙인다', () => {
    expect(formatConfirmedMeetingDate('2026-07-18', '14:00:00')).toBe('2026년 7월 18일 14시');
  });

  it('DATE_ONLY 모임은 날짜까지만 보여준다', () => {
    expect(formatConfirmedMeetingDate('2026-07-18')).toBe('2026년 7월 18일');
  });

  it('한 자리 시각의 0을 떼고 보여준다', () => {
    expect(formatConfirmedMeetingDate('2026-03-05', '09:00:00')).toBe('2026년 3월 5일 9시');
  });
});

describe('formatConfirmedSchedule', () => {
  it('날짜와 시간 범위를 한 줄로 합친다', () => {
    expect(formatConfirmedSchedule('2026-07-18', '14:00:00', '18:00:00')).toBe(
      '7/18 (토) 14:00~18:00'
    );
  });

  it('DATE_ONLY 모임은 날짜까지만 보여준다', () => {
    expect(formatConfirmedSchedule('2026-07-18')).toBe('7/18 (토)');
  });
});

describe('formatCandidateDate', () => {
  it('ISO 날짜를 "월 일 요일"로 바꾼다', () => {
    expect(formatCandidateDate('2026-07-18')).toBe('7월 18일 토요일');
  });

  it('한 자리 월·일에 0을 붙이지 않는다', () => {
    expect(formatCandidateDate('2026-03-05')).toBe('3월 5일 목요일');
  });
});

describe('formatCandidateDuration', () => {
  it.each([
    ['정각 단위', '14:00:00', '18:00:00', '4시간'],
    ['시간과 분', '14:00:00', '15:30:00', '1시간 30분'],
    ['한 시간 미만', '14:00:00', '14:30:00', '30분'],
    ['초를 뺀 형식도 받는다', '09:00', '11:00', '2시간'],
  ])('%s: %s~%s → %s', (_, start, end, expected) => {
    expect(formatCandidateDuration(start, end)).toBe(expected);
  });

  it.each([
    ['끝이 시작과 같으면', '14:00:00', '14:00:00'],
    ['끝이 시작보다 앞이면', '18:00:00', '14:00:00'],
  ])('%s 빈 문자열이다', (_, start, end) => {
    expect(formatCandidateDuration(start, end)).toBe('');
  });
});

describe('formatCandidateTimeRange', () => {
  it('시간 범위 뒤에 길이를 괄호로 붙인다', () => {
    expect(formatCandidateTimeRange('14:00:00', '18:00:00')).toBe('14:00~18:00 (4시간)');
  });

  it('길이를 계산할 수 없으면 범위만 보여준다', () => {
    expect(formatCandidateTimeRange('14:00:00', '14:00:00')).toBe('14:00~14:00');
  });
});
