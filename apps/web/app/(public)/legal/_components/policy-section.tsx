import type { ReactNode } from 'react';

interface PolicySectionProps {
  children: ReactNode;
  label: string;
  title: string;
}

export function PolicySection({ children, label, title }: PolicySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-bold-16 text-neutral-900">
        {label} {title}
      </h2>

      <div className="flex flex-col gap-3 pl-5">{children}</div>
    </section>
  );
}
