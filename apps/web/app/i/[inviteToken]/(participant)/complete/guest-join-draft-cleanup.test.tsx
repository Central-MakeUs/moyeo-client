import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

import { GuestJoinDraftCleanup } from './guest-join-draft-cleanup';

describe('GuestJoinDraftCleanup', () => {
  it('완료 화면에 도착하면 게스트 참여 초안을 초기화한다', () => {
    useGuestJoinDraft.setState({
      identity: { inviteToken: 'ABC123', nickname: '소미', password: '1234' },
      scheduleResponse: { availableDates: ['2026-08-15'] },
      departure: {
        name: '강남역',
        address: '서울 강남구 강남대로 396',
        latitude: 37.4979,
        longitude: 127.0276,
      },
      transportationMode: 'PUBLIC_TRANSIT',
    });

    render(<GuestJoinDraftCleanup />);

    expect(useGuestJoinDraft.getState()).toMatchObject({
      identity: null,
      scheduleResponse: null,
      departure: null,
      transportationMode: null,
    });
  });
});
