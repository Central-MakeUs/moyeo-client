import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { WizardStepLayout } from './wizard-step-layout';

describe('모임 생성 위저드 공통 레이아웃', () => {
  it('제목, 본문과 하단 버튼 영역을 모두 표시한다', () => {
    render(
      <WizardStepLayout header={<h1>제목</h1>} footer={<button>다음</button>}>
        <p>본문</p>
      </WizardStepLayout>
    );

    expect(screen.getByRole('heading', { name: '제목' })).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });
});
