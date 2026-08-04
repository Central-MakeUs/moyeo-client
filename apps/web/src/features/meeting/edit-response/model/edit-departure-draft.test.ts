import { beforeEach, describe, expect, it } from 'vitest';

import { useEditDepartureDraft } from './edit-departure-draft';

const HAPJEONG = { name: '합정역', address: '서울특별시 마포구 양화로 160' };
const SINCHON = { name: '신촌역', address: '서울특별시 서대문구 신촌로 90' };

describe('useEditDepartureDraft', () => {
  beforeEach(() => {
    useEditDepartureDraft.getState().close();
  });

  it('서버가 준 기존 응답으로 초안을 연다', () => {
    useEditDepartureDraft
      .getState()
      .open('29NRVBGXGP', { departure: HAPJEONG, transportationMode: 'CAR' });

    expect(useEditDepartureDraft.getState()).toMatchObject({
      inviteCode: '29NRVBGXGP',
      departure: HAPJEONG,
      transportationMode: 'CAR',
    });
  });

  it('같은 모임을 다시 열어도 덮지 않는다 — 검색에서 돌아올 때 방금 고른 값이 살아남아야 한다', () => {
    const draft = useEditDepartureDraft.getState();
    draft.open('29NRVBGXGP', { departure: HAPJEONG, transportationMode: 'CAR' });
    draft.setDeparture(SINCHON);

    draft.open('29NRVBGXGP', { departure: HAPJEONG, transportationMode: 'CAR' });

    expect(useEditDepartureDraft.getState().departure).toEqual(SINCHON);
  });

  it('다른 모임을 열면 이전 모임의 값을 이어받지 않는다', () => {
    const draft = useEditDepartureDraft.getState();
    draft.open('29NRVBGXGP', { departure: HAPJEONG, transportationMode: 'CAR' });

    draft.open('LX78GD2X7U', { departure: null, transportationMode: null });

    expect(useEditDepartureDraft.getState()).toMatchObject({
      inviteCode: 'LX78GD2X7U',
      departure: null,
      transportationMode: null,
    });
  });
});
