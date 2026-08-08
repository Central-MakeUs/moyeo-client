import Link from 'next/link';
import { CircleAlertIcon } from 'lucide-react';

export interface NotFoundSectionProps {
  message: string;
  actionLabel: string;
  href: string;
}

export function NotFoundSection({
  message,
  actionLabel,
  href,
}: NotFoundSectionProps): React.JSX.Element {
  return (
    <section className="flex flex-col items-center gap-5">
      <CircleAlertIcon aria-hidden="true" className="size-[50px] text-neutral-200" />
      <p className="text-semibold-16 text-neutral-700">{message}</p>
      <Link
        href={href}
        replace
        className="flex h-12 items-center justify-center rounded-8 border border-neutral-50 bg-white px-7"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
