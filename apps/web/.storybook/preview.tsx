import type { Preview } from '@storybook/nextjs-vite';
import { suit } from '../src/_app/fonts';
import '../src/_app/globals.css';

// 데코레이터는 스토리만 감싼다. mdx 문서 본문에도 --font-suit 가 적용되도록
// preview iframe 루트에 변수 클래스를 붙여 전역에서 참조 가능하게 한다.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add(suit.variable);
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <div style={suit.style}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
