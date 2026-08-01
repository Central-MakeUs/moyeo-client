import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { MeetingInvitation } from '@/entities/meeting';
import type { ParticipationStatusResponse } from '@/shared/api';

import { InviteLandingPage } from './invite-landing-page';

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

// 세션 상태별 분기 검증은 #147 몫이라 여기서는 anonymous로 고정한다.
vi.mock('@/entities/session', () => ({
  useSession: () => ({ status: 'anonymous' }),
}));

const INVITATION: MeetingInvitation = {
  name: '데모데이에 모여',
  description: '부산 BEXCO에서 열리는 데모데이에 초대합니다',
  hostNickname: '소미',
};

const renderPage = (
  invitation: MeetingInvitation | null = INVITATION,
  participationStatus?: ParticipationStatusResponse | null
) =>
  render(
    <InviteLandingPage
      inviteCode="ABC123"
      invitation={invitation}
      participationStatus={participationStatus}
    />
  );

describe('InviteLandingPage', () => {
  it('name·description·hostNickname이 모두 있는 초대를 렌더하면 세 값이 화면에 있다', () => {
    renderPage();

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')).toBeInTheDocument();
    expect(screen.getByText('소미')).toBeInTheDocument();
  });

  it('유효한 초대를 렌더하면 모임 초대장이 왔어요! 헤더와 모임 참여하기 버튼이 화면에 있다', () => {
    renderPage();

    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
  });

  it('최초 렌더 직후 본문은 그려지고 이번에만 게스트로 참여하기 버튼은 화면에 없다', () => {
    renderPage();

    // 본문 존재를 함께 단언한다. 화면이 통째로 비어도 "Drawer가 닫혀 있다"는
    // 만족되므로, 부재 단언만 두면 초기 렌더 공백 회귀를 잡지 못한다.
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
    // Drawer가 열렸는지를 내부 상태가 아니라 사용자가 보는 것으로 판정한다.
    expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
  });

  it('유효한 초대를 렌더하면 진행상황 확인하기 버튼이 화면에 있고 disabled 상태다', () => {
    renderPage();

    // VIEW-01이 아직 없어 목적지가 없다(prd.md §4).
    expect(screen.getByRole('button', { name: '진행상황 확인하기' })).toBeDisabled();
  });

  it('description이 null인 초대를 렌더하면 설명 문단이 없고 모임명과 모임장은 남는다', () => {
    renderPage({ ...INVITATION, description: null });

    expect(
      screen.queryByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')
    ).not.toBeInTheDocument();
    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('소미')).toBeInTheDocument();
  });

  it('hostNickname이 null인 초대를 렌더하면 소미가 없고 모임명과 설명은 남는다', () => {
    renderPage({ ...INVITATION, hostNickname: null });

    expect(screen.queryByText('소미')).not.toBeInTheDocument();
    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')).toBeInTheDocument();
  });

  it('description과 hostNickname이 모두 null이면 데모데이에 모여 한 줄만 남은 카드가 렌더된다', () => {
    renderPage({ ...INVITATION, description: null, hostNickname: null });

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(
      screen.queryByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('소미')).not.toBeInTheDocument();
  });

  it('{ canJoin: true, reason: AVAILABLE }을 넘기면 기본 헤더가 보이고 모임 참여하기 버튼이 활성이다', () => {
    renderPage(INVITATION, { canJoin: true, reason: 'AVAILABLE' });

    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeEnabled();
  });

  it('{ canJoin: false, reason: DEADLINE_PASSED }를 넘기면 마감 기한이 지났어요 안내가 보인다', () => {
    renderPage(INVITATION, { canJoin: false, reason: 'DEADLINE_PASSED' });

    expect(screen.getByText('마감 기한이 지났어요')).toBeInTheDocument();
    expect(screen.getByText('아쉽지만 현재는 더 이상 참여할 수 없어요')).toBeInTheDocument();
  });

  it('{ canJoin: false, reason: PARTICIPANT_LIMIT_EXCEEDED }를 넘기면 모임 인원이 모두 찼어요 안내가 보인다', () => {
    renderPage(INVITATION, { canJoin: false, reason: 'PARTICIPANT_LIMIT_EXCEEDED' });

    expect(screen.getByText('모임 인원이 모두 찼어요')).toBeInTheDocument();
    expect(screen.getByText('아쉽지만 현재는 더 이상 참여할 수 없어요')).toBeInTheDocument();
  });

  // 버튼 활성은 canJoin에만 의존하고 reason과 무관하다. 차단 사유별로 같은 배선을
  // 반복 검증하는 게 아니라, "무관하다"는 것 자체를 검증한다.
  it.each(['DEADLINE_PASSED', 'PARTICIPANT_LIMIT_EXCEEDED'] as const)(
    'canJoin이 false면 reason이 %s여도 모임 참여하기 버튼이 disabled다',
    (reason) => {
      renderPage(INVITATION, { canJoin: false, reason });

      expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeDisabled();
    }
  );

  it('participationStatus를 넘기지 않으면 모임 참여하기 버튼이 disabled고 헤더는 기본 문구다', () => {
    renderPage();

    // 필드가 없다고 참여 가능으로 추측하지 않는다.
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeDisabled();
    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
  });

  // Celebration은 컨페티를 <canvas>로 그린다. 둘 다 aria-hidden이라 역할·텍스트로는
  // 구분할 수 없어서, canvas 유무로 축하 연출 여부를 판정한다.
  it('canJoin이 true면 축하 컨페티가 렌더된다', () => {
    const { container } = renderPage(INVITATION, { canJoin: true, reason: 'AVAILABLE' });

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('canJoin이 false면 축하 컨페티를 렌더하지 않는다', () => {
    const { container } = renderPage(INVITATION, { canJoin: false, reason: 'DEADLINE_PASSED' });

    expect(container.querySelector('canvas')).not.toBeInTheDocument();
  });

  it('참여 불가 상태여도 초대 카드의 모임명·설명·모임장은 그대로 렌더된다', () => {
    renderPage(INVITATION, { canJoin: false, reason: 'DEADLINE_PASSED' });

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다')).toBeInTheDocument();
    expect(screen.getByText('소미')).toBeInTheDocument();
  });

  it('message가 함께 오면 그 문구는 화면에 없고 reason 대응 문구가 보인다', () => {
    renderPage(INVITATION, {
      canJoin: false,
      reason: 'DEADLINE_PASSED',
      message: '서버가 준 다른 문구',
    });

    expect(screen.queryByText('서버가 준 다른 문구')).not.toBeInTheDocument();
    expect(screen.getByText('마감 기한이 지났어요')).toBeInTheDocument();
  });

  it('invitation이 null이면 초대 카드는 없고 헤더와 모임 참여하기 버튼은 남는다', () => {
    renderPage(null);

    expect(screen.queryByText('데모데이에 모여')).not.toBeInTheDocument();
    // 404 전용 화면은 #145 몫이라, 여기서는 카드만 생략하고 골격은 유지한다.
    expect(screen.getByText('모임 초대장이 왔어요!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
  });
});
