'use client';

import { useState } from 'react';

import { useSession } from '@/entities/session';

import { useDevAuth } from '../model/use-dev-auth';

/**
 * 개발자 전용 세션 패널.
 *
 * 서비스 UI와 구분되도록 의도적으로 devtools 스타일을 쓴다.
 * 노출 여부는 `_app/dev-tools/dev-auth-panel-mount.tsx` 가 플래그로 결정한다.
 */
export function DevAuthPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const session = useSession();
  const { signIn, signOut, isPending, error } = useDevAuth();

  const accessToken = session.status === 'authenticated' ? session.accessToken : null;

  return (
    <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[9999] flex flex-col items-end">
      {isOpen && (
        <section className="mb-2 w-68 rounded-12 border border-neutral-700 bg-neutral-900 p-3 text-neutral-0 shadow-lg">
          <header className="mb-2 flex items-center justify-between text-semibold-16">
            <span>Dev Auth</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-medium-12 text-neutral-300"
              aria-label="패널 닫기"
            >
              닫기
            </button>
          </header>

          <dl className="mb-3 space-y-1 text-medium-14 text-neutral-100">
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-400">status</dt>
              <dd>{session.status}</dd>
            </div>
            {session.status === 'authenticated' && (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-neutral-400">id</dt>
                  <dd>{session.viewer.id}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-neutral-400">nickname</dt>
                  <dd>{session.viewer.nickname ?? 'null'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-neutral-400">onboarding</dt>
                  <dd>{String(session.viewer.onboardingCompleted)}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between gap-2">
              <dt className="text-neutral-400">token</dt>
              <dd>{accessToken ? '있음' : '없음'}</dd>
            </div>
          </dl>

          <div className="mb-2 flex gap-1">
            <DevButton onClick={() => void signIn('userOne')} disabled={isPending}>
              user1
            </DevButton>
            <DevButton onClick={() => void signIn('userTwo')} disabled={isPending}>
              user2
            </DevButton>
            <DevButton onClick={signOut} disabled={isPending}>
              logout
            </DevButton>
          </div>

          {accessToken && <TokenField accessToken={accessToken} />}

          {error && <p className="mt-2 text-medium-12 text-accessible-300">{error}</p>}
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="size-11 rounded-full bg-neutral-900 text-semibold-14 text-neutral-0 shadow-lg"
        aria-expanded={isOpen}
        aria-label="Dev Auth 패널 열기"
      >
        🔑
      </button>
    </div>
  );
}

function DevButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-6 bg-neutral-700 px-2 py-1.5 text-medium-12 text-neutral-0 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/**
 * `navigator.clipboard`는 secure context에서만 동작한다. 네이티브 dev 빌드는
 * `http://<LAN-IP>:3000` 으로 접속하므로 복사가 불가능할 수 있어, 항상 선택 가능한
 * 텍스트를 함께 노출한다.
 */
function TokenField({ accessToken }: { accessToken: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accessToken);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-1">
      <DevButton onClick={() => void handleCopy()}>
        {copied ? 'copied' : 'copy access token'}
      </DevButton>
      <textarea
        readOnly
        value={accessToken}
        onFocus={(event) => event.currentTarget.select()}
        className="h-14 w-full resize-none rounded-6 bg-neutral-950 p-1 text-medium-12 break-all text-neutral-300"
        aria-label="Access Token"
      />
    </div>
  );
}
