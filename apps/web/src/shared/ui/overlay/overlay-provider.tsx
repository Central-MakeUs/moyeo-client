'use client';

import * as React from 'react';

const OverlayContainerContext = React.createContext<HTMLDivElement | null>(null);

function OverlayProvider({ children }: React.PropsWithChildren) {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  return (
    <OverlayContainerContext.Provider value={container}>
      {children}
      <div
        ref={setContainer}
        data-slot="overlay-root"
        className="pointer-events-none fixed inset-y-0 left-1/2 z-50 w-full max-w-(--app-shell-max-width) -translate-x-1/2 overflow-hidden"
      />
    </OverlayContainerContext.Provider>
  );
}

function useOverlayContainer() {
  return React.useContext(OverlayContainerContext);
}

export { OverlayProvider, useOverlayContainer };
