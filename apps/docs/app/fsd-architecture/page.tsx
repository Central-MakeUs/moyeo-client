import Link from 'next/link';
import styles from './fsd-architecture.module.css';

const references = [
  {
    label: 'FSD - Public API',
    href: 'https://fsd.how/kr/docs/reference/public-api/',
  },
  {
    label: 'FSD - Usage with Next.js',
    href: 'https://fsd.how/kr/docs/guides/tech/with-nextjs/',
  },
  {
    label: 'Next.js - Absolute Imports and Module Path Aliases',
    href: 'https://nextjs.org/docs/app/getting-started/installation#set-up-absolute-imports-and-module-path-aliases',
  },
  {
    label: 'TypeScript - TSConfig baseUrl',
    href: 'https://www.typescriptlang.org/tsconfig/baseUrl.html',
  },
  {
    label: 'TypeScript - TSConfig paths',
    href: 'https://www.typescriptlang.org/tsconfig/paths.html',
  },
  {
    label: 'TypeScript GitHub issue - Deprecate, remove support for baseUrl',
    href: 'https://github.com/microsoft/TypeScript/issues/62207',
  },
  {
    label: 'Stack Overflow - baseUrl deprecation discussion',
    href: 'https://stackoverflow.com/questions/79923194/option-baseurl-is-deprecated-and-will-stop-functioning-in-typescript-7',
  },
];

const decisions = [
  [
    'Next App Router',
    '`apps/web/app`는 라우트 엔트리만 담당하고 실제 화면 구현은 `src/pages`로 위임합니다.',
  ],
  [
    'FSD root',
    '`apps/web/src` 아래에 `app`, `pages`, `widgets`, `features`, `entities`, `shared` 레이어를 둡니다.',
  ],
  ['Alias', '`baseUrl` 없이 `paths`만 사용해 `@/*`를 `./src/*`에 매핑합니다.'],
  ['Public API', '외부 레이어는 slice 내부 파일이 아니라 slice의 `index.ts`를 통해 import합니다.'],
  ['Boundary lint', 'FSD 전용 린터인 Steiger를 사용해 public API와 레이어 경계를 검사합니다.'],
  [
    'UI package boundary',
    '`packages/ui`는 앱 독립적인 공용 UI 패키지, `src/shared/ui`는 web 앱 전용 shared UI로 분리합니다.',
  ],
];

const layerRules = [
  ['app', '앱 전역 설정, provider, global layout, 전역 스타일 진입점'],
  ['pages', '라우트별 화면 구현. Next route file에서 import되는 FSD page'],
  ['widgets', '여러 entity/feature/shared를 조합하는 독립 화면 섹션'],
  ['features', '사용자 행동 단위. 예: create-room, sign-in, update-profile'],
  ['entities', '도메인 객체의 타입, model, entity 전용 UI'],
  ['shared', '도메인과 앱 맥락이 없는 공용 기반. ui, lib, api, routes 등'],
];

const troubleshooting = [
  {
    title: 'Next의 app/pages와 FSD의 app/pages 이름 충돌',
    body: 'FSD 공식 Next.js 가이드는 Next가 요구하는 `app`, `pages` 폴더를 FSD 구조와 분리하라고 설명합니다. 그래서 Next의 `app`은 프로젝트 루트에 두고, FSD 레이어는 `src` 아래에 둡니다.',
  },
  {
    title: 'src/pages를 FSD layer로 쓸 때의 Pages Router 인식 문제',
    body: '`apps/web/pages/README.md`는 Next가 `src/pages`를 Pages Router로 인식하는 문제를 피하고, 이 프로젝트의 `src/pages`가 FSD layer라는 의도를 남기기 위해 둔 문서입니다.',
  },
  {
    title: 'baseUrl을 쓰지 않은 이유',
    body: 'Next 문서는 `baseUrl`과 `paths`를 모두 지원한다고 설명하지만, TypeScript 문서는 `paths` 사용 시 `baseUrl`이 필수가 아니며 `baseUrl`은 AMD loader 맥락의 기능이라고 설명합니다. TypeScript 7에서 제거될 예정이므로 명시 경로 기반 `paths`를 선택했습니다.',
  },
  {
    title: 'metadata 위치',
    body: '현재는 FSD 문서 예제 흐름에 맞춰 FSD page에서 `metadata`를 export하고 Next route file에서 re-export합니다. 다만 metadata는 Next route contract 성격도 강하므로 PR에서 팀 기준을 다시 논의할 항목입니다.',
  },
  {
    title: 'Orval과 Zustand는 후속 이슈',
    body: 'API client와 상태 관리는 FSD 경계 결정 이후에 넣는 편이 안전합니다. Orval 산출물은 `src/shared/api/generated` 후보로 문서화하고, Zustand 기반 debugger는 별도 이슈로 분리합니다.',
  },
];

export default function FsdArchitecturePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>FSD architecture</p>
          <h1>Next.js App Router에서 FSD 기반 구조를 잡은 결정 기록</h1>
          <p>
            `apps/web`에 Feature-Sliced Design을 적용하면서 정한 레이어 경계, alias, public API,
            Steiger 린트, Turborepo UI 패키지와 web shared UI의 역할을 정리합니다. 같은 문제를 다시
            만났을 때 빠르게 판단할 수 있도록 선택 이유와 참고 문서를 함께 남깁니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="FSD architecture sections">
          <a href="#summary">Summary</a>
          <a href="#structure">Structure</a>
          <a href="#next">Next.js</a>
          <a href="#alias">Alias</a>
          <a href="#public-api">Public API</a>
          <a href="#boundaries">Boundaries</a>
          <a href="#troubleshooting">Notes</a>
          <a href="#references">References</a>
        </nav>

        <section className={styles.section} id="summary">
          <p className={styles.stepNumber}>01</p>
          <h2>최종 결정 요약</h2>
          <div className={styles.table}>
            {decisions.map(([title, description]) => (
              <div className={styles.tableRow} key={title}>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="structure">
          <p className={styles.stepNumber}>02</p>
          <h2>FSD 레이어 구조</h2>
          <p>
            레이어는 위에서 아래로만 의존합니다. 예를 들어 `pages`는 `widgets`, `features`,
            `entities`, `shared`를 import할 수 있지만, `entities`가 `features`나 `pages`를
            import하면 경계 위반입니다.
          </p>

          <pre className={styles.codeBlock}>{`apps/web/src
├── app
├── pages
├── widgets
├── features
├── entities
└── shared`}</pre>

          <div className={styles.layerGrid}>
            {layerRules.map(([layer, description]) => (
              <article key={layer}>
                <h3>{layer}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="next">
          <p className={styles.stepNumber}>03</p>
          <h2>Next.js App Router와 FSD의 분리</h2>
          <p>
            FSD의 `app` layer와 Next.js의 `app` directory는 이름은 같지만 역할이 다릅니다. Next의
            `app`은 라우팅 엔트리이므로 루트에 유지하고, FSD의 `app` layer는 `src/app`에 둡니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/app/example/page.tsx
export { ExamplePage as default, metadata } from '@/pages/example';

// apps/web/src/pages/example/index.ts
export { ExamplePage, metadata } from './ui/example';`}</pre>

          <div className={styles.note}>
            <strong>PR 논의 포인트</strong>
            <p>
              `metadata`, `loading.tsx`, `error.tsx`, `not-found.tsx` 같은 Next route contract를
              어디까지 `app`에 남기고 어디까지 FSD page에서 re-export할지는 팀 컨벤션으로 확정해야
              합니다. 현재 예제는 기존 `main` page와 동일한 re-export 방식을 따릅니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="alias">
          <p className={styles.stepNumber}>04</p>
          <h2>Absolute import와 baseUrl 결정</h2>
          <p>
            Next.js는 `tsconfig.json` 또는 `jsconfig.json`의 `paths`, `baseUrl`을 지원합니다. 하지만
            TypeScript 공식 문서와 TypeScript 7 이슈를 고려해 `baseUrl` 없이 명시 경로 기반
            `paths`만 사용합니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`}</pre>

          <div className={styles.compareGrid}>
            <article>
              <h3>사용하지 않는 방식</h3>
              <pre>{`{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@app/*": ["app/*"]
    }
  }
}`}</pre>
            </article>
            <article>
              <h3>선택한 방식</h3>
              <pre>{`{
  "compilerOptions": {
    "paths": {
      "@app/*": ["./src/app/*"],
      "@/*": ["./src/*"]
    }
  }
}`}</pre>
            </article>
          </div>

          <p>
            TypeScript의 `paths`는 `baseUrl`이 없으면 `tsconfig` 파일 위치를 기준으로 해석됩니다.
            따라서 <code>@/*: [&apos;./src/*&apos;]</code>는 별도 `baseUrl` 없이도 web app의 FSD
            root를 가리킵니다.
          </p>
        </section>

        <section className={styles.section} id="public-api">
          <p className={styles.stepNumber}>05</p>
          <h2>Public API와 index.ts 컨벤션</h2>
          <p>
            FSD에서 public API는 slice 외부에서 접근하는 공식 진입점입니다. 외부 레이어는 slice
            내부의 `ui`, `model`, `api` 파일을 직접 import하지 않고 `index.ts`를 통해 필요한 것만
            가져옵니다.
          </p>

          <pre className={styles.codeBlock}>{`// 좋음
import { RoomPreviewSection } from '@/widgets/room-preview';
import { RoomSummaryCard } from '@/entities/room';

// 피함
import { RoomSummaryCard } from '@/entities/room/ui/room-summary-card';`}</pre>

          <div className={styles.note}>
            <strong>index.ts 작성 기준</strong>
            <p>
              `export *`는 편하지만 slice의 외부 계약을 흐리게 만들 수 있습니다. 현재는 필요한
              컴포넌트와 타입만 명시적으로 re-export합니다. 같은 slice 내부에서는 public API를
              우회하지 말고 상대 경로를 사용해 순환 참조를 피합니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="boundaries">
          <p className={styles.stepNumber}>06</p>
          <h2>Steiger 경계 린트</h2>
          <p>
            Public API 규칙은 문서만으로 유지하기 어렵습니다. FSD 공식 문서에서도 Steiger 같은
            아키텍처 린터로 import 경로를 검사하는 방식을 언급합니다. 이 프로젝트는
            `@feature-sliced/steiger-plugin`과 `steiger`를 web 앱에 추가했습니다.
          </p>

          <pre className={styles.codeBlock}>{`// apps/web/package.json
{
  "scripts": {
    "lint:steiger": "steiger src"
  }
}`}</pre>

          <pre className={styles.codeBlock}>{`// apps/web/steiger.config.js
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // FSD 경계 검사와 무관한 보조 파일은 검사 대상에서 제외한다.
    ignores: ['**/*.stories.tsx'],
  },
  {
    // shared 레이어는 하위 공용 기반이므로 slice public API 강제를 적용하지 않는다.
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
  {
    rules: {
      // 초기 예제 slice는 작게 유지하므로 참조 횟수 기반 검사를 비활성화한다.
      'fsd/insignificant-slice': 'off',
    },
  },
]);`}</pre>
        </section>

        <section className={styles.section} id="troubleshooting">
          <p className={styles.stepNumber}>07</p>
          <h2>작업 중 헷갈린 지점</h2>
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
          <pre className={styles.codeBlock}>{`pnpm --filter @repo/web lint
pnpm --filter @repo/web check-types
pnpm --filter @repo/web lint:steiger
pnpm lint
pnpm exec lint-staged --debug`}</pre>
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
