import React from 'react';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-viewport">
      <div className="app-shell">{children}</div>
    </div>
  );
}
