import { describe, it, expect } from 'vitest';

import { toBlockedGuide } from './blocked-guide';

const BLOCKED_DESCRIPTION = '아쉽지만 현재는 더 이상 참여할 수 없어요';
const FALLBACK_TITLE = '모임에 참여할 수 없어요';

describe('toBlockedGuide', () => {
  it('reason이 DEADLINE_PASSED면 마감 기한이 지났어요를 돌려준다', () => {
    const guide = toBlockedGuide({ canJoin: false, reason: 'DEADLINE_PASSED' });

    expect(guide).toEqual({
      title: '마감 기한이 지났어요',
      description: BLOCKED_DESCRIPTION,
    });
  });

  it('reason이 PARTICIPANT_LIMIT_EXCEEDED면 모임 인원이 모두 찼어요를 돌려준다', () => {
    const guide = toBlockedGuide({ canJoin: false, reason: 'PARTICIPANT_LIMIT_EXCEEDED' });

    expect(guide).toEqual({
      title: '모임 인원이 모두 찼어요',
      description: BLOCKED_DESCRIPTION,
    });
  });

  it('message가 함께 오면 message를 무시하고 reason 대응 문구를 돌려준다', () => {
    const guide = toBlockedGuide({
      canJoin: false,
      reason: 'DEADLINE_PASSED',
      message: '서버가 준 다른 문구',
    });

    expect(guide).toEqual({
      title: '마감 기한이 지났어요',
      description: BLOCKED_DESCRIPTION,
    });
  });

  // 호출부가 isExplainedBlockReason으로 걸러 실제로는 오지 않는 입력이다.
  // 문구가 비거나 undefined가 새어나가지 않는지만 확인한다.
  it('설명할 수 없는 사유·null·undefined면 기본 제목과 차단 설명을 돌려준다', () => {
    const expected = { title: FALLBACK_TITLE, description: BLOCKED_DESCRIPTION };

    expect(toBlockedGuide({ canJoin: false, reason: 'MEETING_CONFIRMED' })).toEqual(expected);
    expect(toBlockedGuide({ canJoin: false })).toEqual(expected);
    expect(toBlockedGuide(null)).toEqual(expected);
    expect(toBlockedGuide(undefined)).toEqual(expected);
  });
});
