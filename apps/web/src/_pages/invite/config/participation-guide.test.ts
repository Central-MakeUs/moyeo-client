import { describe, it, expect } from 'vitest';

import { toParticipationGuide } from './participation-guide';

const DEFAULT_TITLE = '모임 초대장이 왔어요!';
const DEFAULT_DESCRIPTION = '모임에 참여해서 일정과 장소를 정해보세요';
const BLOCKED_DESCRIPTION = '아쉽지만 현재는 더 이상 참여할 수 없어요';

describe('toParticipationGuide', () => {
  it('{ canJoin: true, reason: AVAILABLE }이면 기본 문구와 canJoin true를 돌려준다', () => {
    const guide = toParticipationGuide({ canJoin: true, reason: 'AVAILABLE' });

    expect(guide).toEqual({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canJoin: true,
    });
  });

  it('{ canJoin: false, reason: DEADLINE_PASSED }이면 마감 기한이 지났어요와 canJoin false를 돌려준다', () => {
    const guide = toParticipationGuide({ canJoin: false, reason: 'DEADLINE_PASSED' });

    expect(guide).toEqual({
      title: '마감 기한이 지났어요',
      description: BLOCKED_DESCRIPTION,
      canJoin: false,
    });
  });

  it('{ canJoin: false, reason: PARTICIPANT_LIMIT_EXCEEDED }이면 모임 인원이 모두 찼어요와 canJoin false를 돌려준다', () => {
    const guide = toParticipationGuide({
      canJoin: false,
      reason: 'PARTICIPANT_LIMIT_EXCEEDED',
    });

    expect(guide).toEqual({
      title: '모임 인원이 모두 찼어요',
      description: BLOCKED_DESCRIPTION,
      canJoin: false,
    });
  });

  it('reason이 undefined면 기본 문구를 돌려주고 canJoin은 canJoin 값을 따른다', () => {
    const guide = toParticipationGuide({ canJoin: true });

    expect(guide).toEqual({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canJoin: true,
    });
  });

  it('canJoin 필드가 없으면 canJoin false를 돌려준다', () => {
    const guide = toParticipationGuide({ reason: 'DEADLINE_PASSED' });

    expect(guide.canJoin).toBe(false);
  });

  it('null 또는 undefined를 넘기면 기본 문구와 canJoin false를 돌려준다', () => {
    const expected = {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canJoin: false,
    };

    expect(toParticipationGuide(null)).toEqual(expected);
    expect(toParticipationGuide(undefined)).toEqual(expected);
  });

  it('{ canJoin: true, reason: DEADLINE_PASSED }처럼 어긋나면 문구는 reason을, 활성은 canJoin을 따른다', () => {
    const guide = toParticipationGuide({ canJoin: true, reason: 'DEADLINE_PASSED' });

    expect(guide.title).toBe('마감 기한이 지났어요');
    expect(guide.canJoin).toBe(true);
  });

  it('message가 함께 오면 message를 무시하고 reason 대응 문구를 돌려준다', () => {
    const guide = toParticipationGuide({
      canJoin: false,
      reason: 'DEADLINE_PASSED',
      message: '서버가 준 다른 문구',
    });

    expect(guide.title).toBe('마감 기한이 지났어요');
    expect(guide.description).toBe(BLOCKED_DESCRIPTION);
  });
});
