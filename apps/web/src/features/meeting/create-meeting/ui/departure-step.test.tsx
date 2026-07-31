import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft, type DepartureDraft } from '../model/create-meeting-draft';
import { DepartureStep } from './departure-step';

const DEPARTURE: DepartureDraft = {
  name: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

const renderStep = (props?: Partial<React.ComponentProps<typeof DepartureStep>>) =>
  render(<DepartureStep onNext={vi.fn()} onSearch={vi.fn()} {...props} />);

beforeEach(() => {
  useCreateMeetingDraft.setState({
    planningType: 'PLACE_ONLY',
    departure: null,
    transportationMode: null,
  });
});

describe('DepartureStep', () => {
  it('출발지와 이동수단이 모두 선택되면 다음이 활성화된다', () => {
    useCreateMeetingDraft.setState({
      departure: DEPARTURE,
      transportationMode: 'PUBLIC_TRANSIT',
    });
    renderStep();

    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  });

  it('출발지 필드를 탭하면 onSearch가 호출된다', async () => {
    const onSearch = vi.fn();
    renderStep({ onSearch });

    await userEvent.click(screen.getByRole('button', { name: /출발지/ }));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("출발지 없이 대중교통을 선택해도 draft transportationMode가 'PUBLIC_TRANSIT'이 된다", async () => {
    renderStep();

    await userEvent.click(screen.getByRole('radio', { name: '대중교통' }));

    expect(useCreateMeetingDraft.getState().transportationMode).toBe('PUBLIC_TRANSIT');
  });

  it('출발지만 있고 이동수단이 없으면 다음이 비활성이다', () => {
    useCreateMeetingDraft.setState({
      departure: DEPARTURE,
      transportationMode: null,
    });
    renderStep();

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('출발지가 없으면 다음이 비활성이다', () => {
    renderStep();

    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  });

  it('다른 이동수단을 선택하면 기존 선택이 해제된다', async () => {
    useCreateMeetingDraft.setState({
      departure: DEPARTURE,
      transportationMode: 'PUBLIC_TRANSIT',
    });
    renderStep();

    await userEvent.click(screen.getByRole('radio', { name: '자동차' }));

    expect(useCreateMeetingDraft.getState().transportationMode).toBe('CAR');
  });
});
