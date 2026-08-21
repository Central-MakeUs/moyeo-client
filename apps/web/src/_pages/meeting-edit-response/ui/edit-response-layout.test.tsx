import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EditResponseLayout } from './edit-response-layout';

describe('EditResponseLayout', () => {
  it('조회 중이면 본문 영역만 불러오는 중이라고 알린다', () => {
    render(
      <EditResponseLayout onBack={vi.fn()} isLoading>
        <div data-testid="body-skeleton" />
      </EditResponseLayout>
    );

    const status = screen.getByRole('status', { name: '내 응답을 불러오는 중' });

    expect(status).toContainElement(screen.getByTestId('body-skeleton'));
    // 뒤로가기는 live region 밖에 있어야 로딩이 끝날 때 함께 읽히지 않는다.
    expect(status).not.toContainElement(screen.getByRole('button', { name: '뒤로가기' }));
  });

  it('조회 중에는 제목 대신 자리표시자를 그려 값이 와도 본문이 밀리지 않는다', () => {
    const { rerender } = render(<EditResponseLayout onBack={vi.fn()} isLoading />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    rerender(<EditResponseLayout onBack={vi.fn()} title="출발지와 이동수단을 알려주세요" />);

    expect(
      screen.getByRole('heading', { name: '출발지와 이동수단을 알려주세요' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('조회 중에도 하단 CTA 자리를 차지한다', () => {
    const { rerender } = render(<EditResponseLayout onBack={vi.fn()} isLoading />);

    // 조회 중에는 누를 수 있는 저장 버튼이 없다.
    expect(screen.queryByRole('button', { name: '수정 완료' })).not.toBeInTheDocument();

    rerender(<EditResponseLayout onBack={vi.fn()} title="제목" onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: '수정 완료' })).toBeInTheDocument();
  });
});
