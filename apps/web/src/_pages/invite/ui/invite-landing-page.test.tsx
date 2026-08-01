import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { readOAuthTransaction } from '@/entities/auth';
import type { MeetingInvitation } from '@/entities/meeting';
import type { SessionState } from '@/entities/session';
import type { ParticipationStatusResponse } from '@/shared/api';

import { InviteLandingPage } from './invite-landing-page';

const { push, replace, session, native } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  // 세션 상태와 실행 환경은 테스트마다 바꾼다(#147). 기본값은 모바일 웹 비로그인.
  session: { current: { status: 'anonymous' } as SessionState },
  native: { current: false },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  // Drawer가 열리면 SocialLoginButtons가 복귀 경로(next)를 읽는다.
  useSearchParams: () => new URLSearchParams(),
}));

// Drawer 안의 SocialLoginButtons가 같은 모듈의 NEXT_PARAM 등을 함께 쓰므로 부분 모킹한다.
vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  useSession: () => session.current,
}));

vi.mock('@/shared/model', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/model')>()),
  isNativeContext: () => native.current,
}));

beforeEach(() => {
  session.current = { status: 'anonymous' };
  native.current = false;
  push.mockClear();
  replace.mockClear();
  sessionStorage.clear();
  // Apple 웹 로그인은 local 콜백을 지원하지 않아 stub하지 않으면 throw 한다.
  vi.stubEnv('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET', 'dev');
  vi.stubEnv('NEXT_PUBLIC_KAKAO_CLIENT_ID', 'kakao-client-id');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  describe('참여하기 분기 (#147)', () => {
    const AVAILABLE: ParticipationStatusResponse = { canJoin: true, reason: 'AVAILABLE' };

    it('anonymous이고 모바일 웹이면 모임 참여하기 탭 시 게스트 선택지가 있는 Drawer가 열린다', async () => {
      renderPage(INVITATION, AVAILABLE);

      await userEvent.click(screen.getByRole('button', { name: '모임 참여하기' }));

      expect(screen.getByText('이번에만 게스트로 참여하기')).toBeInTheDocument();
    });

    it('anonymous이고 WebView 안이면 모임 참여하기 탭 시 게스트 선택지가 없는 Drawer가 열린다', async () => {
      native.current = true;
      renderPage(INVITATION, AVAILABLE);

      await userEvent.click(screen.getByRole('button', { name: '모임 참여하기' }));

      // Drawer 자체는 열려야 한다. 소셜 로그인 수단으로 열림을 확인한다.
      expect(screen.getByRole('button', { name: /카카오/ })).toBeInTheDocument();
      expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
    });

    it('authenticated면 모임 참여하기 탭 시 Drawer가 열리지 않고 닉네임 경로로 이동한다', async () => {
      session.current = {
        status: 'authenticated',
        accessToken: 'token',
        viewer: { id: 1, nickname: '소미', onboardingCompleted: true },
      };
      renderPage(INVITATION, AVAILABLE);

      await userEvent.click(screen.getByRole('button', { name: '모임 참여하기' }));

      expect(push).toHaveBeenCalledWith('/i/ABC123/nickname');
      expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
    });

    it('세션이 loading이면 모임 참여하기 버튼이 disabled다', () => {
      session.current = { status: 'loading' };
      renderPage(INVITATION, AVAILABLE);

      expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeDisabled();
    });

    it('최초 렌더에는 Drawer가 닫혀 있고 본문이 그려진다', () => {
      renderPage(INVITATION, AVAILABLE);

      expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeInTheDocument();
      expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
    });

    it('Drawer에서 카카오로 로그인하면 초대 화면 경로가 복귀 목적지로 저장된다', async () => {
      renderPage(INVITATION, AVAILABLE);
      await userEvent.click(screen.getByRole('button', { name: '모임 참여하기' }));

      await userEvent.click(screen.getByRole('button', { name: /카카오로 시작하기/ }));

      // /i/ABC123/nickname이 아니다 — 로그인하는 사이 마감·정원이 바뀔 수 있어
      // 참여 가능 상태를 다시 통과해야 한다(prd.md ADR-4).
      expect(readOAuthTransaction()?.next).toBe('/i/ABC123');
    });

    it('세션이 error면 오류 안내와 다시 시도 버튼이 보이고 모임 참여하기는 disabled다', () => {
      session.current = { status: 'error', retry: vi.fn() };
      renderPage(INVITATION, AVAILABLE);

      expect(screen.getByText('모임 정보를 불러오지 못했어요')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '모임 참여하기' })).toBeDisabled();
    });

    it('세션이 error일 때 다시 시도를 탭하면 세션 retry가 호출된다', async () => {
      const retry = vi.fn();
      session.current = { status: 'error', retry };
      renderPage(INVITATION, AVAILABLE);

      await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

      expect(retry).toHaveBeenCalledTimes(1);
    });

    it('세션이 정상이면 오류 안내가 보이지 않는다', () => {
      renderPage(INVITATION, AVAILABLE);

      expect(screen.queryByText('모임 정보를 불러오지 못했어요')).not.toBeInTheDocument();
    });

    it('Drawer가 열린 상태에서 오버레이를 탭하면 Drawer가 닫히고 초대 화면이 남는다', async () => {
      renderPage(INVITATION, AVAILABLE);
      await userEvent.click(screen.getByRole('button', { name: '모임 참여하기' }));
      expect(screen.getByText('이번에만 게스트로 참여하기')).toBeInTheDocument();

      await userEvent.click(document.querySelector('[data-vaul-overlay]') as Element);

      expect(screen.queryByText('이번에만 게스트로 참여하기')).not.toBeInTheDocument();
      expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    });
  });
});
