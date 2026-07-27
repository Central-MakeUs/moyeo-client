import type { PropsWithChildren } from 'react';

import { Toaster } from '../toast';
import { OverlayProvider } from '../overlay/overlay-provider';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Toaster>
      <OverlayProvider>
        <div className="app-viewport">
          <div className="app-shell bg-white">{children}</div>
        </div>
      </OverlayProvider>
    </Toaster>
  );
}
