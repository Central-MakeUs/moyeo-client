import type { PropsWithChildren } from 'react';

import { OverlayProvider } from '../overlay/overlay-provider';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <OverlayProvider>
      <div className="app-viewport">
        <div className="app-shell">{children}</div>
      </div>
    </OverlayProvider>
  );
}
