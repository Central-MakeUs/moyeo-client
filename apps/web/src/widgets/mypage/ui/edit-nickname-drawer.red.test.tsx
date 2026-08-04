/**
 * 🔴 의도적으로 실패하는 테스트 (TDD Red).
 *
 * 지금 고치지 않기로 한 것 중 "이 동작이 맞다"고 판단한 것을 미리 박아둔다.
 * 구현을 고치면 초록이 된다. 앱스토어 제출 범위에서 뺄 거면 이 파일째 지우면 된다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { EditNicknameDrawer } from './edit-nickname-drawer';

const { invalidateQueries, setQueryData, mutate, updateState } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  mutate: vi.fn(),
  updateState: { isPending: false },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries, setQueryData }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  getMeQueryKey: () => ['/api/auth/me'],
  getMeQueryOptions: () => ({ queryKey: ['/api/auth/me'] }),
  useUpdateNickname: () => ({ mutate, isPending: updateState.isPending }),
}));

function mutateCallbacks(): { onSuccess?: (user: unknown) => void } {
  return mutate.mock.calls.at(-1)?.[1] ?? {};
}

async function openDrawer(currentNickname = '모여') {
  render(
    <EditNicknameDrawer currentNickname={currentNickname} trigger={<button>닉네임 편집</button>} />
  );
  await userEvent.click(screen.getByRole('button', { name: '닉네임 편집' }));
  return screen.findByRole('textbox');
}

describe('EditNicknameDrawer (Red)', () => {
  beforeEach(() => {
    invalidateQueries.mockClear();
    setQueryData.mockClear();
    mutate.mockClear();
    updateState.isPending = false;
    vi.spyOn(toast, 'add').mockImplementation(() => 'toast-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCH 응답으로 사용자 캐시를 즉시 갱신한다', async () => {
    // 현재: `invalidateQueries`만 호출해 `GET /api/auth/me`를 한 번 더 왕복한다.
    // PATCH /api/users/me/nickname은 갱신된 AuthUserResponse를 그대로 돌려주므로
    // 재요청 없이 `setQueryData`로 덮으면 된다. 온보딩 폼이 이미 그 패턴이다.
    const updated = { id: 1, nickname: '새이름', onboardingCompleted: true };
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '완료' }));
    mutateCallbacks().onSuccess?.(updated);

    expect(setQueryData).toHaveBeenCalledWith(['/api/auth/me'], updated);
  });

  it('닉네임을 바꾼 직후 옛 닉네임을 되살리지 않는다', async () => {
    // 현재: 닫을 때 `setNickname(currentNickname)`으로 prop(옛 값)을 복원하는데
    // prop은 캐시가 갱신된 뒤에야 바뀌므로, 그 사이 입력창에 옛 닉네임이 남는다.
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '완료' }));
    mutateCallbacks().onSuccess?.({ id: 1, nickname: '새이름', onboardingCompleted: true });

    await userEvent.click(screen.getByRole('button', { name: '닉네임 편집' }));

    expect(await screen.findByRole('textbox')).toHaveValue('새이름');
  });

  it('입력창에 접근 가능한 이름이 있다', async () => {
    // 현재: label도 aria-label도 없어 스크린리더가 "편집" 으로만 읽는다.
    // InputField 주석이 "생략하면 호출부가 aria-label을 준다"고 명시한 케이스다.
    await openDrawer('모여');

    expect(screen.getByRole('textbox', { name: /닉네임/ })).toBeInTheDocument();
  });
});
