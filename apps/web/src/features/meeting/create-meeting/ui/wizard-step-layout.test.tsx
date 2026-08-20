import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CTASection } from '@/shared/ui/cta-section';

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

  it('CTASection의 토스트 오프셋 경계를 중복해서 만들지 않는다', () => {
    const { container } = render(
      <WizardStepLayout
        header={<h1>제목</h1>}
        footer={<CTASection primaryAction={<button>다음</button>} />}
      >
        <p>본문</p>
      </WizardStepLayout>
    );

    expect(container.querySelectorAll('[data-slot="toast-offset-boundary"]')).toHaveLength(1);
  });

  it('제출 중이면 본문 영역에 aria-busy를 표시한다', () => {
    // 자리표시자가 아니라 "지금 처리 중"이라는 사실을 스크린리더에 알린다.
    const { container } = render(
      <WizardStepLayout header={<h1>제목</h1>} footer={<button>다음</button>} isSubmitting>
        <p>본문</p>
      </WizardStepLayout>
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('제출 중이 아니면 aria-busy를 붙이지 않는다', () => {
    const { container } = render(
      <WizardStepLayout header={<h1>제목</h1>} footer={<button>다음</button>}>
        <p>본문</p>
      </WizardStepLayout>
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('제출 중에도 하단 CTA는 잠금 표시 밖에 남는다', () => {
    // CTA는 제출 진행을 알리는 스피너를 들고 있다. 본문과 함께 흐려지면 멈춘 것처럼 보인다.
    const { container } = render(
      <WizardStepLayout header={<h1>제목</h1>} footer={<button>다음</button>} isSubmitting>
        <p>본문</p>
      </WizardStepLayout>
    );

    const busy = container.querySelector('[aria-busy="true"]');

    expect(busy).not.toBeNull();
    expect(busy).not.toContainElement(screen.getByRole('button', { name: '다음' }));
  });
});
