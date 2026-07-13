import Link from 'next/link';
import styles from './icon-system.module.css';

const references = [
  {
    label: 'Storybook - MDX',
    href: 'https://storybook.js.org/docs/writing-docs/mdx',
    description: 'MDX 문서 구성, Doc Blocks, GFM 확장과 표 렌더링 문제 해결 방법.',
  },
  {
    label: 'Storybook - Markdown tables troubleshooting',
    href: 'https://storybook.js.org/docs/writing-docs/mdx#markdown-tables-arent-rendering-correctly',
    description: 'remark-gfm을 addon-docs의 MDX compile option에 연결하는 공식 예제.',
  },
  {
    label: 'remark-gfm',
    href: 'https://github.com/remarkjs/remark-gfm',
    description: '표, 취소선, task list 등 GitHub Flavored Markdown 문법을 지원하는 remark plugin.',
  },
  {
    label: 'GitHub Flavored Markdown Spec',
    href: 'https://github.github.com/gfm/',
    description: 'CommonMark에 추가되는 GFM 문법의 공식 명세.',
  },
  {
    label: 'Storybook - Vite builder configuration',
    href: 'https://storybook.js.org/docs/builders/vite',
    description: 'viteFinal과 mergeConfig를 이용한 Storybook Vite 설정 확장 방법.',
  },
  {
    label: 'vite-plugin-svgr',
    href: 'https://github.com/pd4d10/vite-plugin-svgr',
    description: 'Vite에서 SVG를 React 컴포넌트로 변환하는 plugin.',
  },
  {
    label: 'SVGR documentation',
    href: 'https://react-svgr.com/docs/',
    description: 'SVG를 React 컴포넌트로 변환하는 방식과 설정 옵션.',
  },
  {
    label: 'MDN - SVG color attribute',
    href: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/color',
    description: 'fill과 stroke에서 currentColor를 사용하는 SVG 표준 동작.',
  },
  {
    label: 'MDN - aria-hidden',
    href: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden',
    description: '장식 요소를 접근성 트리에서 제외할 때의 동작과 주의사항.',
  },
  {
    label: 'WAI-ARIA - aria-hidden',
    href: 'https://www.w3.org/TR/wai-aria-1.3/#aria-hidden',
    description: '중복되거나 부가적인 콘텐츠를 보조 기술에서 제외하는 표준 정의.',
  },
  {
    label: 'TypeScript - keyof type operator',
    href: 'https://www.typescriptlang.org/docs/handbook/2/keyof-types.html',
    description: '레지스트리 key에서 IconName union type을 유도하는 TypeScript 문법.',
  },
];

const decisions = [
  [
    '단일 제품 API',
    '제품 코드는 SVG를 직접 import하지 않고 Icon 컴포넌트와 등록된 name을 사용합니다.',
  ],
  [
    '파일이 source of truth',
    'assets/icons의 SVG 파일 목록에서 ICONS 레지스트리와 IconName을 생성합니다.',
  ],
  [
    '고정 방향은 이름으로 표현',
    'chevron-left처럼 방향이 의미인 경우 방향별 SVG를 사용하고, 회전이 상태인 경우에만 rotate를 사용합니다.',
  ],
  [
    '색상은 사용하는 곳에서 결정',
    '단색 SVG는 currentColor를 사용하고 hover, disabled, dark mode는 컴포넌트와 디자인 토큰이 책임집니다.',
  ],
  [
    '장식 아이콘이 기본',
    'aria-label이 없으면 접근성 트리에서 제외하고, label이 있으면 의미 있는 이미지로 노출합니다.',
  ],
  [
    'Storybook을 살아 있는 문서로 사용',
    'Playground와 All Icons에서 실제 레지스트리, props, 접근성 동작을 함께 확인합니다.',
  ],
];

const comparison = [
  ['등록', 'icon.tsx에서 import와 map을 수동 수정', 'SVG 추가 후 생성 명령으로 자동 갱신'],
  ['타입', '수동 ICONS와 함께 관리', 'keyof typeof ICONS에서 자동 유도'],
  ['방향', '범용 아이콘과 rotate에 의존', '고정 방향은 이름과 SVG로 명시'],
  ['색상', 'SVG 내부 값에 따라 달라질 수 있음', '단색 아이콘은 currentColor로 통일'],
  ['접근성', '호출부마다 aria-hidden을 반복', '장식 기본값과 aria-label 기반 전환'],
  ['가시성', '사용 가능한 목록을 코드에서 확인', 'Storybook All Icons에서 이름과 함께 확인'],
];

const troubleshooting = [
  {
    title: 'Markdown 표가 표가 아니라 파이프 문자열로 표시됨',
    symptom:
      'Iconography.mdx에 표 문법을 작성했지만 Storybook Docs에서 table로 변환되지 않고 일반 텍스트처럼 렌더링됐습니다.',
    cause:
      'Storybook MDX의 기본 Markdown 지원은 CommonMark 기준입니다. 표는 기본 Markdown 문법이 아니라 GitHub Flavored Markdown 확장이므로 별도 parser plugin이 필요합니다.',
    resolution:
      'Storybook 공식 troubleshooting 안내에 따라 remark-gfm을 devDependency로 설치하고 addon-docs의 mdxCompileOptions.remarkPlugins에 연결했습니다.',
  },
  {
    title: 'remark-gfm 추가 후 Unexpected FunctionDeclaration 발생',
    symptom:
      'MDX 변환 결과의 _createMdxContent 함수에서 “only import/exports are supported” 오류가 발생했습니다.',
    cause:
      '기존 addon-docs 문자열 등록을 남긴 채 option이 있는 addon-docs 객체를 추가해 동일한 MDX addon이 두 번 등록됐습니다. 첫 번째 변환 결과가 두 번째 MDX 변환기로 다시 들어간 것이 원인이었습니다.',
    resolution:
      'addon-docs를 하나의 설정 객체로 합쳤습니다. addon을 확장할 때 기존 등록을 교체해야 하며, 같은 addon을 단순히 하나 더 추가하면 안 됩니다.',
  },
  {
    title: 'Next.js에서는 보이던 SVG가 Vite Storybook에서 다르게 처리됨',
    symptom:
      '애플리케이션과 Storybook이 SVG import를 동일한 React 컴포넌트로 해석한다는 보장이 없었습니다.',
    cause:
      '현재 Storybook은 @storybook/nextjs-vite를 사용합니다. Next.js 애플리케이션 설정과 Storybook의 Vite preview는 서로 다른 bundler 경로를 사용합니다.',
    resolution:
      'Storybook의 viteFinal에서 기존 config를 merge하고 vite-plugin-svgr를 추가했습니다. SVG는 React component로 처리하고, Next image plugin의 SVG 처리는 제외했습니다.',
  },
  {
    title: 'Storybook 정적 빌드 후 전체 lint가 대량 경고를 출력함',
    symptom:
      'build-storybook 이후 eslint가 storybook-static의 minified JavaScript까지 검사해 변경 코드와 무관한 경고를 출력했습니다.',
    cause: '정적 산출물이 소스 검사 범위에 들어오면 generated bundle도 lint 대상이 됩니다.',
    resolution:
      '변경 소스는 별도 scoped lint로 확인했습니다. CI에서는 lint를 build-storybook보다 먼저 실행하거나, storybook-static을 ESLint ignore에 명시하는 편이 안전합니다.',
  },
];

export default function IconSystemPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Icon system</p>
          <h1>타입 안전한 SVG 아이콘 시스템과 Storybook 문서화 결정 기록</h1>
          <p>
            기존 Icon 컴포넌트와 수동 SVG 레지스트리를 확장하면서 고민한 API 경계, 방향별 에셋,
            currentColor, 접근성 기본값, 자동 생성과 Storybook MDX 문제 해결 과정을 기록합니다. 같은
            시스템을 다시 만들거나 설계 선택을 설명해야 할 때 재사용할 수 있도록 결과뿐 아니라 판단
            근거와 실패 원인까지 함께 남깁니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Icon system sections">
          <a href="#context">Context</a>
          <a href="#decisions">Decisions</a>
          <a href="#architecture">Architecture</a>
          <a href="#direction">Direction</a>
          <a href="#color">Color</a>
          <a href="#accessibility">Accessibility</a>
          <a href="#workflow">Workflow</a>
          <a href="#storybook">Storybook</a>
          <a href="#troubleshooting">Troubleshooting</a>
          <a href="#references">References</a>
        </nav>

        <section className={styles.section} id="context">
          <p className={styles.stepNumber}>01</p>
          <h2>출발점과 해결하려던 문제</h2>
          <p>
            기존 구현은 Icon 컴포넌트 안에서 SVG import, ICONS 객체, IconName type을 직접 관리하는
            단순하고 이해하기 쉬운 구조였습니다. 아이콘 수가 적을 때는 충분하지만, 에셋이 늘어나면
            파일 추가와 레지스트리 수정이 서로 다른 작업이 되어 누락 가능성이 생깁니다.
          </p>

          <div className={styles.compareTable}>
            <div className={styles.compareHeader}>
              <strong>구분</strong>
              <strong>기존 방식</strong>
              <strong>변경 방식</strong>
            </div>
            {comparison.map(([subject, before, after]) => (
              <div className={styles.compareRow} key={subject}>
                <strong>{subject}</strong>
                <span>{before}</span>
                <span>{after}</span>
              </div>
            ))}
          </div>

          <div className={styles.note}>
            <strong>변경의 핵심</strong>
            <p>
              기존 컴포넌트를 버리고 새 추상화를 만든 것이 아니라, 제품에서 이미 사용하던 단일 Icon
              API는 유지하면서 반복 등록과 접근성 실수를 시스템 쪽으로 이동했습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="decisions">
          <p className={styles.stepNumber}>02</p>
          <h2>최종 결정 요약</h2>
          <div className={styles.decisionGrid}>
            {decisions.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="architecture">
          <p className={styles.stepNumber}>03</p>
          <h2>컴포넌트와 생성 구조</h2>
          <p>
            SVG directory를 source of truth로 삼습니다. 생성기는 파일 목록을 정렬하고, 파일명을
            PascalCase import와 kebab-case registry key로 변환합니다. 따라서 타입과 Storybook 목록은
            같은 레지스트리를 바라봅니다.
          </p>

          <pre className={styles.codeBlock}>{`shared/assets/icons/*.svg
        │
        ▼
scripts/generate-icons.mjs
        │
        ▼
icons.generated.ts
  ├─ SVG imports
  ├─ ICONS registry
  └─ IconName = keyof typeof ICONS
        │
        ├─ <Icon name="…" />
        └─ Storybook All Icons`}</pre>

          <pre className={styles.codeBlock}>{`// 생성 결과의 핵심 형태
export const ICONS = {
  "caret-down": CaretDown,
  "chevron-left": ChevronLeft,
  "chevron-small-left": ChevronSmallLeft,
} as const;

export type IconName = keyof typeof ICONS;`}</pre>

          <p>
            생성 파일은 검토 가능한 일반 TypeScript로 commit합니다. build 시점에 암묵적으로 생성하기
            보다 변경된 public name을 PR diff에서 확인할 수 있고, CI와 로컬의 생성 결과 차이도 찾기
            쉽습니다.
          </p>
        </section>

        <section className={styles.section} id="direction">
          <p className={styles.stepNumber}>04</p>
          <h2>고정 방향과 상태 회전을 구분한 이유</h2>
          <p>
            뒤로 이동, 다음 항목, 위·아래 이동처럼 고정된 방향은 화면에서 전달하는 의미입니다.
            이름에 방향을 포함하면 코드 검색, 리팩터링, 디자인 변경 추적이 쉬워지고 transform 적용
            여부를 따라가지 않아도 됩니다.
          </p>

          <div className={styles.compareGrid}>
            <article>
              <h3>고정 방향</h3>
              <pre>{`<Icon name="chevron-left" />
<Icon name="chevron-right" />
<Icon name="chevron-up" />
<Icon name="chevron-down" />`}</pre>
              <p>navigation과 배치 의미가 고정된 경우 방향별 name과 SVG를 사용합니다.</p>
            </article>
            <article>
              <h3>상태 전환</h3>
              <pre>{`<Icon
  name="chevron-down"
  className={isOpen ? "rotate-180" : undefined}
/>`}</pre>
              <p>Accordion처럼 회전 자체가 상태 변화를 보여주는 경우 하나의 아이콘을 회전합니다.</p>
            </article>
          </div>

          <div className={styles.note}>
            <strong>small은 색상 상태가 아니다</strong>
            <p>
              작은 chevron은 단순 축소가 아니라 24×24 viewBox 안에서 path와 여백이 다르게 조정된
              optical variant입니다. 그래서 muted 같은 색상 상태 이름 대신
              <code>chevron-small-left</code>처럼 형태 차이를 이름으로 표현했습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="color">
          <p className={styles.stepNumber}>05</p>
          <h2>SVG는 형태, 색상은 context가 책임진다</h2>
          <p>
            단색 UI 아이콘의 fill과 stroke는 <code>currentColor</code>를 사용합니다. SVG에 hex를
            고정하면 hover, disabled, dark mode마다 내부 path를 덮어써야 하지만 currentColor는
            부모의 CSS color와 디자인 토큰을 그대로 상속합니다.
          </p>

          <pre className={styles.codeBlock}>{`<!-- SVG asset -->
<path d="…" fill="currentColor" />

// product component
<button className="text-neutral-600 hover:text-neutral-900 disabled:text-neutral-300">
  <Icon name="chevron-right" />
</button>`}</pre>

          <div className={styles.note}>
            <strong>예외</strong>
            <p>
              브랜드 로고나 다색 일러스트처럼 색이 에셋 정체성의 일부라면 currentColor를 강제하지
              않습니다. 일반 UI icon과 brand/illustration asset은 같은 정책으로 관리하지 않습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="accessibility">
          <p className={styles.stepNumber}>06</p>
          <h2>장식 아이콘을 안전한 기본값으로</h2>
          <p>
            제품에서 아이콘 대부분은 텍스트나 버튼 의미를 보조합니다. 매 호출부가
            <code>aria-hidden</code>을 반복하도록 두면 누락이 생기므로, label이 없는 아이콘은
            장식으로 보고 접근성 트리에서 제외합니다. 아이콘 자체가 정보를 전달할 때만
            <code>aria-label</code>을 제공합니다.
          </p>

          <pre className={styles.codeBlock}>{`// 텍스트가 이름을 제공: Icon은 자동으로 aria-hidden
<button>
  다음
  <Icon name="chevron-right" />
</button>

// 버튼이 이름을 제공: Icon은 장식
<button aria-label="닫기">
  <Icon name="close" />
</button>

// Icon 자체가 정보: role="img"가 자동 적용
<Icon name="check" aria-label="완료" />`}</pre>

          <div className={styles.warning}>
            <strong>주의</strong>
            <p>
              aria-hidden은 focus 가능한 요소나 focus 가능한 자손이 있는 요소에 사용하면 안 됩니다.
              Icon은 시각 요소이며 클릭과 keyboard interaction은 Button 같은 semantic component가
              담당해야 합니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="workflow">
          <p className={styles.stepNumber}>07</p>
          <h2>아이콘 추가 절차</h2>
          <ol className={styles.steps}>
            <li>
              <strong>SVG를 추가한다</strong>
              <span>
                <code>apps/web/src/shared/assets/icons</code>에 kebab-case 이름으로 추가합니다.
              </span>
            </li>
            <li>
              <strong>에셋 규칙을 확인한다</strong>
              <span>24×24 viewBox, 단색은 currentColor, 색상 상태를 파일명에 넣지 않습니다.</span>
            </li>
            <li>
              <strong>레지스트리를 생성한다</strong>
              <span>
                루트에서 <code>pnpm generate:icons</code>를 실행합니다.
              </span>
            </li>
            <li>
              <strong>생성 diff를 검토한다</strong>
              <span>icons.generated.ts의 import, key, IconName 변경이 의도와 같은지 봅니다.</span>
            </li>
            <li>
              <strong>Storybook에서 시각 검수한다</strong>
              <span>
                Foundations/Iconography의 All Icons와 Playground에서 이름과 렌더링을 확인합니다.
              </span>
            </li>
          </ol>

          <pre className={styles.codeBlock}>{`pnpm generate:icons
pnpm --filter @repo/web check-types
pnpm --filter @repo/web build-storybook`}</pre>
        </section>

        <section className={styles.section} id="storybook">
          <p className={styles.stepNumber}>08</p>
          <h2>Storybook을 운영 문서로 사용</h2>
          <p>
            Storybook 문서는 컴포넌트 API와 실제 레지스트리를 같은 코드에서 읽습니다. 문서에 이름을
            수동으로 복사하지 않으므로 아이콘을 생성한 뒤 All Icons 목록도 자동으로 갱신됩니다.
          </p>

          <div className={styles.decisionGrid}>
            <article>
              <h3>Playground</h3>
              <p>name, size, rotate, className과 접근성 props를 바꾸며 단일 아이콘을 확인합니다.</p>
            </article>
            <article>
              <h3>All Icons</h3>
              <p>등록된 전체 아이콘과 실제 IconName을 반응형 grid에서 한 번에 검수합니다.</p>
            </article>
            <article>
              <h3>Iconography MDX</h3>
              <p>
                사용법, naming, color, size, accessibility, DO/DON&apos;T와 추가 절차를 설명합니다.
              </p>
            </article>
          </div>

          <pre className={styles.codeBlock}>{`// apps/web/.storybook/main.ts
{
  name: getAbsolutePath("@storybook/addon-docs"),
  options: {
    mdxPluginOptions: {
      mdxCompileOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  },
}`}</pre>
        </section>

        <section className={styles.section} id="troubleshooting">
          <p className={styles.stepNumber}>09</p>
          <h2>트러블슈팅 기록</h2>
          <div className={styles.troubleshootingList}>
            {troubleshooting.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <dl>
                  <div>
                    <dt>증상</dt>
                    <dd>{item.symptom}</dd>
                  </div>
                  <div>
                    <dt>원인</dt>
                    <dd>{item.cause}</dd>
                  </div>
                  <div>
                    <dt>해결</dt>
                    <dd>{item.resolution}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className={styles.compareGrid}>
            <article>
              <h3>잘못된 addon 중복 등록</h3>
              <pre>{`addons: [
  getAbsolutePath("@storybook/addon-docs"),
  { name: "@storybook/addon-docs", options: { /* ... */ } },
]`}</pre>
            </article>
            <article>
              <h3>하나의 설정 객체로 교체</h3>
              <pre>{`addons: [
  {
    name: getAbsolutePath("@storybook/addon-docs"),
    options: { /* MDX options */ },
  },
]`}</pre>
            </article>
          </div>
        </section>

        <section className={styles.section} id="interview-notes">
          <p className={styles.stepNumber}>10</p>
          <h2>다시 설명할 때의 핵심 포인트</h2>
          <ul className={styles.keyPoints}>
            <li>
              파일 수를 줄이는 것보다 검색 가능성과 변경 의도를 명확히 하는 것을 선택했습니다.
            </li>
            <li>
              반복 작업은 생성기로 옮기되 결과물은 commit해 review 가능한 구조를 유지했습니다.
            </li>
            <li>아이콘의 형태, 색상, 상호작용, 접근성 책임을 서로 다른 layer로 분리했습니다.</li>
            <li>
              Storybook 문서는 별도 목록이 아니라 production registry를 읽는 living
              documentation입니다.
            </li>
            <li>
              문제 해결 시 오류 메시지보다 변환 pipeline과 plugin 중복 여부를 먼저 추적했습니다.
            </li>
          </ul>
        </section>

        <section className={styles.section} id="references">
          <h2>공식 참고 문서</h2>
          <ul className={styles.referenceList}>
            {references.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
                <p>{reference.description}</p>
                <span>{reference.href}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
