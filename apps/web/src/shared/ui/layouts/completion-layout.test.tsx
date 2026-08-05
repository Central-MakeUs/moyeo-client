import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CTASection } from '../cta-section';
import { CompletionLayout } from './completion-layout';

describe('완료 화면 공통 레이아웃', () => {
  it('CTASection의 토스트 오프셋 경계를 중복해서 만들지 않는다', () => {
    const { container } = render(
      <CompletionLayout
        header={<h1>완료</h1>}
        visual={<div>일러스트</div>}
        footer={<CTASection primaryAction={<button>확인</button>} />}
      />
    );

    expect(container.querySelectorAll('[data-slot="toast-offset-boundary"]')).toHaveLength(1);
  });
});
