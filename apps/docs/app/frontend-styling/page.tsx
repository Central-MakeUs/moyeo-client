import Link from 'next/link';
import styles from './frontend-styling.module.css';

const references = [
  {
    label: 'Tailwind CSS - Install Tailwind CSS with Next.js',
    href: 'https://tailwindcss.com/docs/installation/framework-guides/nextjs',
  },
  {
    label: 'Next.js - Font Optimization',
    href: 'https://nextjs.org/docs/app/getting-started/fonts',
  },
  {
    label: 'prettier-plugin-tailwindcss npm package',
    href: 'https://www.npmjs.com/package/prettier-plugin-tailwindcss',
  },
];

const changedFiles = [
  [
    'apps/web/package.json',
    'Tailwind v4, PostCSS, prettier-plugin-tailwindcss 의존성과 format script.',
  ],
  ['apps/web/postcss.config.mjs', '@tailwindcss/postcss 플러그인 연결.'],
  ['apps/web/app/styles/globals.css', 'Tailwind import와 web 전역 스타일 진입점.'],
  ['apps/web/prettier.config.mjs', 'web 앱 전용 Tailwind class 정렬 설정.'],
  ['apps/web/app/layout.tsx', 'next/font/local로 SUIT variable font 적용.'],
  ['package.json', 'lint-staged에서 apps/web만 web Prettier config를 명시.'],
];

const troubleshooting = [
  {
    title: 'turbo --pnpfilter 오타',
    body: '`turbo run dev --filter=@repo/web --pnpfilter=docs`는 Turborepo가 모르는 옵션이라 실패했습니다. `--pnpfilter`가 아니라 `--filter=docs`를 써야 합니다.',
  },
  {
    title: 'Prettier plugin은 CLI와 VS Code가 다르게 보일 수 있음',
    body: '`pnpm --filter @repo/web format`은 동작했지만 저장 시 자동 정렬이 안 보일 수 있었습니다. VS Code Prettier Output에서 어떤 config를 읽는지 확인했고, 필요하면 `Developer: Reload Window`로 확장을 다시 로드합니다.',
  },
  {
    title: '루트 package.json 저장 시 포맷이 안 되는 문제',
    body: 'Tailwind class 정렬과 JSON 들여쓰기는 별개입니다. 루트 package.json은 루트 prettier.config.mjs를 사용합니다. 저장 시 JSON 포맷이 안 되면 VS Code에서 JSON/JSONC defaultFormatter가 Prettier인지 확인합니다.',
  },
  {
    title: 'tailwindFunctions는 cn/clsx 도입 시점에 추가',
    body: "`cn`, `clsx`를 아직 설치하지 않았다면 `tailwindFunctions: ['cn', 'clsx']`는 보류합니다. clsx + tailwind-merge + cn() 유틸을 추가하는 커밋에서 같이 넣는 편이 변경 이유가 분명합니다.",
  },
  {
    title: 'styles 디렉터리와 globals.css 위치',
    body: 'Tailwind v4의 CSS entry 파일 경로는 Prettier plugin, ESLint plugin, layout import에서 함께 참조됩니다. `app/globals.css`와 `app/styles/globals.css` 사이에서 이동하면 세 곳의 경로를 같이 확인해야 합니다.',
  },
];

export default function FrontendStylingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Frontend styling</p>
          <h1>Tailwind CSS v4, Prettier class 정렬, Next font 적용 기록</h1>
          <p>
            `apps/web`에 Tailwind CSS v4를 붙이고, Tailwind class 자동 정렬을 Prettier로 처리하며,
            Next.js App Router에서 SUIT local font를 적용한 과정을 정리합니다. 공식 문서를 따라간
            부분과 실제 작업 중 헷갈렸던 지점을 함께 남깁니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Frontend styling sections">
          <a href="#tailwind">Tailwind v4</a>
          <a href="#prettier">Prettier plugin</a>
          <a href="#font">Next font</a>
          <a href="#decisions">Decisions</a>
          <a href="#troubleshooting">Troubleshooting</a>
          <a href="#references">References</a>
        </nav>

        <section className={styles.section} id="tailwind">
          <p className={styles.stepNumber}>01</p>
          <h2>Tailwind CSS v4 설치</h2>
          <p>
            Tailwind 공식 Next.js guide는 v4 기준으로 <code>tailwindcss</code>와{' '}
            <code>@tailwindcss/postcss</code>를 설치하고, PostCSS config에 Tailwind plugin을 연결한
            뒤 CSS entry에서 <code>@import &apos;tailwindcss&apos;</code>를 선언하는 흐름입니다. 이
            레포에서는 Next 앱인 <code>apps/web</code>에만 설치했습니다.
          </p>

          <pre
            className={styles.codeBlock}
          >{`pnpm --filter @repo/web add -D tailwindcss @tailwindcss/postcss postcss`}</pre>

          <p>PostCSS 설정은 web 앱 안에 둡니다.</p>
          <pre className={styles.codeBlock}>{`// apps/web/postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;`}</pre>

          <p>CSS entry 파일에는 Tailwind를 import합니다.</p>
          <pre className={styles.codeBlock}>{`/* apps/web/app/styles/globals.css */
@import 'tailwindcss';

@layer base {
  body {
    font-family: var(--font-suit);
  }
}`}</pre>
        </section>

        <section className={styles.section} id="prettier">
          <p className={styles.stepNumber}>02</p>
          <h2>prettier-plugin-tailwindcss 설정</h2>
          <p>
            Tailwind class 순서는 ESLint가 아니라 Prettier가 담당하게 했습니다. npm metadata 확인
            기준 `prettier-plugin-tailwindcss` 0.8.0은 Prettier 3 peer dependency를 갖고 있으며,
            Tailwind Labs가 관리하는 class sorting plugin입니다.
          </p>

          <pre
            className={styles.codeBlock}
          >{`pnpm --filter @repo/web add -D prettier-plugin-tailwindcss`}</pre>

          <p>
            공통 Prettier config는 `packages/prettier-config`에 그대로 두고, Tailwind stylesheet
            경로가 필요한 설정만 `apps/web/prettier.config.mjs`로 분리했습니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/prettier.config.mjs
import baseConfig from '@repo/prettier-config';
import * as tailwindPlugin from 'prettier-plugin-tailwindcss';

export default {
  ...baseConfig,
  plugins: [tailwindPlugin],
  tailwindStylesheet: './app/styles/globals.css',
};`}</pre>

          <div className={styles.note}>
            <strong>주의</strong>
            <p>
              처음에는 <code>plugins: [&apos;prettier-plugin-tailwindcss&apos;]</code>로 두었지만,
              VS Code와 monorepo plugin resolve 경로가 헷갈릴 수 있어 직접 import 방식으로
              정리했습니다. 이 plugin은 default export가 아니므로{' '}
              <code>import * as tailwindPlugin</code> 형태를 사용합니다.
            </p>
          </div>

          <p>web 앱 전용 format script도 추가했습니다.</p>
          <pre className={styles.codeBlock}>{`// apps/web/package.json
{
  "scripts": {
    "format": "prettier . --write --config prettier.config.mjs"
  }
}`}</pre>

          <p>
            `lint-staged`에서는 `apps/web` 파일만 web Prettier config를 명시합니다. docs와 native는
            아직 Tailwind stylesheet 경로가 확정되지 않았으므로 기존 공통 Prettier 흐름을
            유지합니다.
          </p>
          <pre className={styles.codeBlock}>{`// package.json
{
  "lint-staged": {
    "apps/web/**/*.{js,jsx,ts,tsx}": [
      "eslint --fix --config apps/web/eslint.config.mjs",
      "prettier --write --config apps/web/prettier.config.mjs"
    ],
    "apps/web/**/*.{css,md,mdx,json}": [
      "prettier --write --config apps/web/prettier.config.mjs"
    ]
  }
}`}</pre>
        </section>

        <section className={styles.section} id="font">
          <p className={styles.stepNumber}>03</p>
          <h2>Next.js local font 적용</h2>
          <p>
            Next.js 공식 Font Optimization 문서는 `next/font/local`을 사용하면 local font 파일을
            self-hosting하고 layout shift 없이 최적화된 font를 적용할 수 있다고 설명합니다. local
            font 경로는 `localFont`가 호출되는 파일 기준 상대 경로로 해석됩니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/app/layout.tsx
import localFont from 'next/font/local';
import './styles/globals.css';

const suit = localFont({
  src: './fonts/SUIT-Variable.woff2',
  variable: '--font-suit',
  display: 'swap',
  weight: '100 900',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={\`\${suit.variable}\`}>{children}</body>
    </html>
  );
}`}</pre>

          <h3>className과 variable 차이</h3>
          <div className={styles.compareGrid}>
            <article>
              <h4>font.className</h4>
              <p>
                Next가 생성한 class를 요소에 붙여 font-family를 바로 적용합니다. 가장 단순하지만,
                CSS나 Tailwind theme에서 font 값을 변수로 재사용하기는 어렵습니다.
              </p>
              <pre>{`<body className={suit.className}>`}</pre>
            </article>
            <article>
              <h4>font.variable</h4>
              <p>
                지정한 CSS custom property를 생성합니다. `body`에 variable class를 붙이고 CSS에서
                `var(--font-suit)`로 사용하는 방식이라, Tailwind/CSS token 흐름과 연결하기 좋습니다.
              </p>
              <pre>{`<body className={suit.variable}>

body {
  font-family: var(--font-suit);
}`}</pre>
            </article>
          </div>

          <p>
            이 프로젝트는 SUIT를 앱 기본 폰트로 쓰되 CSS entry에서 font-family를 관리하기 위해
            `variable` 방식을 선택했습니다.
          </p>
        </section>

        <section className={styles.section} id="decisions">
          <p className={styles.stepNumber}>04</p>
          <h2>이번 작업의 결정 사항</h2>
          <div className={styles.table}>
            {changedFiles.map(([path, description]) => (
              <div className={styles.tableRow} key={path}>
                <code>{path}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>

          <div className={styles.note}>
            <strong>보류한 것</strong>
            <p>
              <code>clsx</code>, <code>tailwind-merge</code>, <code>cn()</code> 유틸은 아직 설치하지
              않았습니다. 따라서 <code>tailwindFunctions: [&apos;cn&apos;, &apos;clsx&apos;]</code>
              도 이번 Prettier 설정에서는 제외합니다. 나중에 <code>cn()</code> 유틸을 추가하는
              커밋에서 같이 넣습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="troubleshooting">
          <p className={styles.stepNumber}>05</p>
          <h2>버벅인 부분과 해결 기준</h2>
          <div className={styles.notes}>
            {troubleshooting.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="commands">
          <h2>검증 명령어</h2>
          <pre className={styles.codeBlock}>{`pnpm --filter @repo/web format
pnpm exec prettier --find-config-path package.json
pnpm exec prettier --check package.json
pnpm exec prettier package.json --write
pnpm lint`}</pre>
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
