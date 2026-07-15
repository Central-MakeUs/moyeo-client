import type { Decorator, Parameters } from '@storybook/nextjs-vite';
import type { CSSProperties } from 'react';

import { AppLayout } from '@/shared/ui/layouts';

import { MOBILE_DEFAULT_VIEWPORT, MOBILE_VIEWPORTS } from '../viewports';

const mobileShellStyle = {
  '--app-shell-max-width': MOBILE_VIEWPORTS.mobileDefault.styles.width,
} as CSSProperties;

export const withAppShell: Decorator = (Story) => (
  <div style={mobileShellStyle}>
    <AppLayout>
      <div className="flex min-h-dvh flex-col bg-neutral-50">
        <Story />
      </div>
    </AppLayout>
  </div>
);

export const withCenteredLayout: Decorator = (Story) => (
  <div className="m-auto">
    <Story />
  </div>
);

export const withBottomLayout: Decorator = (Story) => (
  <div className="mt-auto w-full">
    <Story />
  </div>
);

export const mobileShellParameters = {
  layout: 'fullscreen',
  viewport: {
    disable: false,
    options: MOBILE_VIEWPORTS,
  },
  docs: {
    story: {
      inline: false,
      iframeHeight: 800,
    },
  },
} satisfies Parameters;

export const mobileViewportGlobals = {
  viewport: {
    value: MOBILE_DEFAULT_VIEWPORT,
    isRotated: false,
  },
};
