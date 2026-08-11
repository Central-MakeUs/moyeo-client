import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppError, { isChunkLoadError } from './error';

describe('AppError', () => {
  afterEach(() => vi.restoreAllMocks());

  it('하위 클라이언트 오류 대신 안내와 다시 시도 수단을 렌더한다', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reset = vi.fn();

    render(<AppError error={new Error('render failed')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('화면을 불러오는 중 문제가 발생했어요');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('실패한 chunk import는 Error Boundary reset이 아닌 전체 reload 대상으로 분류한다', () => {
    const error = new Error(
      'Failed to load chunk /_next/static/chunks/apps_web_app_(public)_page.js'
    );
    error.name = 'ChunkLoadError';

    expect(isChunkLoadError(error)).toBe(true);
    expect(isChunkLoadError(new Error('render failed'))).toBe(false);
  });

  it('오프라인에서는 재시도를 막고 연결 복구를 안내한다', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AppError error={new Error('offline')} reset={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('네트워크 연결이 끊겼어요.');
    expect(screen.getByRole('button', { name: '연결을 기다리는 중' })).toBeDisabled();
  });
});
