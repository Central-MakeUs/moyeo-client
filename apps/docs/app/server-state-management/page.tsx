import Link from 'next/link';
import styles from './server-state-management.module.css';

const references = [
  {
    label: 'TanStack Query - Advanced Server Rendering',
    href: 'https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr',
  },
  {
    label: 'TanStack Query - ESLint Plugin Query',
    href: 'https://tanstack.com/query/latest/docs/eslint/eslint-plugin-query#flat-config-eslintconfigjs',
  },
  {
    label: 'TanStack Query - Devtools',
    href: 'https://tanstack.com/query/latest/docs/framework/react/devtools',
  },
];

const changedFiles = [
  ['apps/web/package.json', 'TanStack Query, Devtools, ESLint plugin 의존성 추가.'],
  [
    'apps/web/src/_app/providers/query-provider.tsx',
    'QueryClientProvider와 ReactQueryDevtools 구성.',
  ],
  ['apps/web/src/_app/index.ts', 'FSD app layer의 provider public API.'],
  ['apps/web/app/layout.tsx', 'Next root layout에서 QueryProvider 연결.'],
  ['apps/web/eslint.config.mjs', 'TanStack Query flat recommended ESLint config 연결.'],
];

const decisions = [
  {
    title: 'Provider는 FSD app layer에 둔다',
    body: 'QueryClientProvider는 앱 전체 실행 환경을 감싸는 설정이므로 `src/app/providers`에 둡니다. Next route entry인 `app/layout.tsx`는 provider를 연결만 합니다.',
  },
  {
    title: 'QueryClient는 서버와 브라우저에서 다르게 생성한다',
    body: 'TanStack Query의 Advanced SSR 가이드를 따라 서버에서는 요청마다 새 QueryClient를 만들고, 브라우저에서는 한 번 만든 QueryClient를 재사용합니다.',
  },
  {
    title: '기본 staleTime을 60초로 둔다',
    body: 'SSR/initial render 이후 클라이언트에서 즉시 refetch되는 것을 줄이기 위해 queries 기본 `staleTime`을 `60 * 1000`으로 설정했습니다.',
  },
  {
    title: 'Devtools는 devDependency로 둔다',
    body: 'Devtools 문서에서 Next 13+ App Dir 사용 시 dev dependency 설치를 안내하므로 `@tanstack/react-query-devtools`는 devDependencies에 둡니다.',
  },
  {
    title: 'ESLint plugin은 web 앱 config에만 연결한다',
    body: 'TanStack Query는 현재 `apps/web`에서만 사용하므로 공통 ESLint config가 아니라 `apps/web/eslint.config.mjs`에 flat recommended config를 추가합니다.',
  },
];

export default function StateManagementPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Server state management</p>
          <h1>TanStack Query 기반 서버 상태 관리 셋업 기록</h1>
          <p>
            `apps/web`에 TanStack Query Provider, React Query Devtools, TanStack Query ESLint
            plugin을 추가하면서 참고한 공식 문서와 결정 이유를 정리합니다. 이번 문서는 서버 상태
            관리 기반 설정에 집중하며, Zustand store 설계와 실제 API 연동은 후속 작업에서 다룹니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Server state management sections">
          <a href="#commands">Commands</a>
          <a href="#provider">Provider</a>
          <a href="#eslint">ESLint</a>
          <a href="#decisions">Decisions</a>
          <a href="#troubleshooting">Notes</a>
          <a href="#references">References</a>
        </nav>

        <section className={styles.section} id="commands">
          <p className={styles.stepNumber}>01</p>
          <h2>설치 명령어</h2>
          <p>
            런타임에서 사용하는 <code>@tanstack/react-query</code>는 dependencies에 두고, 개발
            도구와 lint plugin은 devDependencies에 둡니다.
          </p>

          <pre className={styles.codeBlock}>{`pnpm --filter @repo/web add @tanstack/react-query
pnpm --filter @repo/web add -D @tanstack/react-query-devtools @tanstack/eslint-plugin-query`}</pre>

          <div className={styles.note}>
            <strong>Devtools 의존성 위치</strong>
            <p>
              TanStack Query Devtools 문서는 Devtools가 별도 패키지이며, Next 13+ App Dir에서는 dev
              dependency로 설치해야 한다고 안내합니다. 따라서 예제 package.json과 다르게 이
              프로젝트에서는 devDependencies에 둡니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="provider">
          <p className={styles.stepNumber}>02</p>
          <h2>QueryProvider 구성</h2>
          <p>
            Advanced SSR 가이드는 QueryClientProvider가 내부적으로 context를 사용하므로 provider
            파일에 <code>&apos;use client&apos;</code>를 붙이고, Next root layout에서 해당
            provider를 감싸는 방식을 안내합니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/src/_app/providers/query-provider.tsx
'use client';

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}`}</pre>

          <p>
            서버에서는 요청마다 QueryClient를 새로 만들고, 브라우저에서는 전역 변수에 보관한
            QueryClient를 재사용합니다.
          </p>

          <pre className={styles.codeBlock}>{`let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}`}</pre>

          <pre className={styles.codeBlock}>{`// apps/web/app/layout.tsx
import { QueryProvider } from '@/_app';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}`}</pre>
        </section>

        <section className={styles.section} id="eslint">
          <p className={styles.stepNumber}>03</p>
          <h2>TanStack Query ESLint plugin</h2>
          <p>
            TanStack Query는 잘못된 QueryClient 생성이나 불안정한 dependency 사용을 막기 위한 전용
            ESLint plugin을 제공합니다. 공식 문서의 flat config 예시를 web 앱의 ESLint config에만
            추가했습니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/eslint.config.mjs
import pluginQuery from '@tanstack/eslint-plugin-query';
import { nextJsConfig } from '@repo/eslint-config/next-js';

export default [...nextJsConfig, ...pluginQuery.configs['flat/recommended']];`}</pre>

          <div className={styles.note}>
            <strong>적용 확인</strong>
            <p>
              임시로 Client Component 내부에서 <code>new QueryClient()</code>를 직접 생성했을 때{' '}
              <code>@tanstack/query/stable-query-client</code> 경고가 발생했고, 현재 web lint는
              <code>--max-warnings 0</code>이므로 실패 처리되는 것을 확인했습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="decisions">
          <p className={styles.stepNumber}>04</p>
          <h2>이번 작업의 결정 사항</h2>
          <div className={styles.notes}>
            {decisions.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="files">
          <p className={styles.stepNumber}>05</p>
          <h2>변경 파일</h2>
          <div className={styles.table}>
            {changedFiles.map(([path, description]) => (
              <div className={styles.tableRow} key={path}>
                <code>{path}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="troubleshooting">
          <p className={styles.stepNumber}>06</p>
          <h2>작업 중 확인한 지점</h2>
          <div className={styles.note}>
            <strong>useQuery는 Client Component에서 호출한다</strong>
            <p>
              Next App Router의 컴포넌트는 기본적으로 Server Component입니다. <code>useQuery</code>
              는 client hook이므로 해당 hook을 호출하는 UI 파일에는{' '}
              <code>&apos;use client&apos;</code>가 필요합니다.
            </p>
          </div>

          <div className={styles.note}>
            <strong>검증용 API/UI 예제는 PR에서 제외</strong>
            <p>
              JSONPlaceholder photos를 이용해 QueryProvider 동작은 확인했지만, 이미지 URL 안정성과
              임시 entity 코드가 PR 범위를 흐릴 수 있어 검증용 예제는 제거했습니다. 실제 API 연동은
              Orval/API 이슈에서 다룹니다.
            </p>
          </div>

          <div className={styles.note}>
            <strong>Zustand는 별도 기준으로 정리</strong>
            <p>
              이번 문서는 TanStack Query 기반 설정을 기록합니다. Zustand 설치, store 위치, 예시
              store 검증은 같은 상태 관리 이슈 안에서 진행하더라도 별도 커밋과 문서 섹션으로
              분리하는 편이 범위를 추적하기 좋습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="verify">
          <h2>검증 명령어</h2>
          <pre className={styles.codeBlock}>{`pnpm --filter @repo/web lint
pnpm --filter @repo/web check-types`}</pre>
        </section>

        <section className={styles.section} id="references">
          <h2>참고 문서</h2>
          <ul className={styles.referenceList}>
            {references.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
                <span>{reference.href}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
