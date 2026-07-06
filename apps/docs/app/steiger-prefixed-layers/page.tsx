import Link from 'next/link';
import styles from './steiger-prefixed-layers.module.css';

const concerns = [
  '_pages에서 _app을 import해도 Steiger가 잡지 못하는가?',
  'widgets에서 _pages를 import해도 Steiger가 잡지 못하는가?',
  'prefix 때문에 FSD의 핵심 레이어 경계 검사가 무력화되는가?',
];

const conclusions = [
  ['Prefix layer', '`_app`, `_pages`는 각각 `app`, `pages`로 정상 인식된다.'],
  ['Boundary lint', '`fsd/forbidden-imports`는 prefix layer에서도 정상 동작한다.'],
  ['Actual issue', '`fsd/typo-in-layer-name`만 raw folder name을 봐서 `_pages`를 오탐한다.'],
  ['Decision', '`_app`, `_pages` 경로에서만 `fsd/typo-in-layer-name`을 비활성화한다.'],
];

const probeResults = [
  {
    title: '_pages에서 _app import',
    code: `src\\_pages\\__steiger-delete-me__\\ui\\page-imports-app.tsx
✘ Forbidden import from higher layer "app".
fsd/forbidden-imports`,
  },
  {
    title: '_widgets에서 _pages import',
    code: `src\\_widgets\\__steiger-delete-me__\\ui\\widget-imports-page.tsx
✘ Forbidden import from higher layer "pages".
fsd/forbidden-imports`,
  },
];

export default function SteigerPrefixedLayersPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Troubleshooting</p>
          <h1>Steiger는 `_app`, `_pages` prefix layer의 import 경계를 잡을 수 있는가</h1>
          <p>
            Next.js 예약 디렉터리와 FSD 레이어 이름 충돌을 피하려고 `_app`, `_pages`를 사용했을 때,
            Steiger의 계층 검사가 여전히 유효한지 확인한 기록입니다. 단순히 린트 에러를 없애는 것이
            아니라, 아키텍처 안전망이 유지되는지 확인하는 것이 목적이었습니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Steiger prefix layer sections">
          <a href="#concern">Concern</a>
          <a href="#filesystem">Filesystem</a>
          <a href="#steiger">Steiger</a>
          <a href="#typo">Typo rule</a>
          <a href="#probe">Probe</a>
          <a href="#decision">Decision</a>
        </nav>

        <section className={styles.section} id="concern">
          <p className={styles.stepNumber}>01</p>
          <h2>처음 염려했던 부분</h2>
          <p>
            Steiger가 `_app`, `_pages`를 오타로 보고 에러를 냈을 때 진짜 걱정한 것은 에러 메시지
            자체가 아니었습니다. 더 중요한 질문은 prefix 때문에 Steiger가 이 폴더들을 FSD의 `app`,
            `pages` 레이어로 인식하지 못하게 되는지였습니다.
          </p>

          <div className={styles.concernList}>
            {concerns.map((concern) => (
              <p key={concern}>{concern}</p>
            ))}
          </div>
        </section>

        <section className={styles.section} id="filesystem">
          <p className={styles.stepNumber}>02</p>
          <h2>`@feature-sliced/filesystem`에서 확인한 것</h2>
          <p>
            Steiger는 FSD 구조 해석을 `@feature-sliced/filesystem`에 위임합니다. 그래서 prefix layer
            인식 여부는 이 패키지의 `hasPrefix`, `removePrefix`, `getLayers`를 확인해야 했습니다.
          </p>

          <pre className={styles.codeBlock}>{`function hasPrefix(path: string): boolean {
  return /^([0-9]_|_)/.test(path);
}

function removePrefix(path: string): string {
  return path.replace(/^([0-9]_|_)/, '');
}`}</pre>

          <p>
            `getLayers`는 폴더 이름에서 prefix를 제거한 뒤 표준 FSD 레이어 이름인지 확인합니다.
            따라서 `_pages`는 `pages`, `_app`은 `app`으로 인식됩니다.
          </p>

          <pre className={styles.codeBlock}>{`const name = basename(child.path);
const layer = layerSequence[layerSequence.indexOf(removePrefix(name))];`}</pre>

          <div className={styles.note}>
            <strong>중요한 성질</strong>
            <p>
              레이어 이름은 `pages`처럼 정규화되지만 실제 경로는 `src/_pages`로 유지됩니다. 즉
              Steiger는 FSD 레이어 역할과 실제 파일 위치를 모두 알고 있습니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="steiger">
          <p className={styles.stepNumber}>03</p>
          <h2>Steiger import 검사는 정규화된 layer를 사용한다</h2>
          <p>
            `fsd/forbidden-imports`는 source file을 인덱싱할 때 `getLayers(root)` 결과를 사용합니다.
            이 시점의 `layerName`은 `_pages`가 아니라 `pages`, `_app`이 아니라 `app`입니다.
          </p>

          <pre
            className={styles.codeBlock}
          >{`for (const [layerName, layer] of Object.entries(getLayers(root))) {
  // 각 파일에 layerName, sliceName, segmentName 메타데이터를 붙임
}`}</pre>

          <pre
            className={styles.codeBlock}
          >{`const thisLayerIndex = layerSequence.indexOf(sourceFile.layerName);
const dependencyLayerIndex = layerSequence.indexOf(dependencyLocation.layerName);

if (thisLayerIndex < dependencyLayerIndex) {
  // 낮은 레이어가 높은 레이어를 import하면 에러
}`}</pre>
        </section>

        <section className={styles.section} id="typo">
          <p className={styles.stepNumber}>04</p>
          <h2>실제 원인은 `typo-in-layer-name` 오탐</h2>
          <p>
            문제가 된 `fsd/typo-in-layer-name` 규칙은 `getLayers` 흐름을 사용하지 않고 root 아래
            폴더명을 직접 읽습니다. 그래서 `_pages`를 `pages`의 오타로 착각합니다.
          </p>

          <pre
            className={styles.codeBlock}
          >{`const layer = basename(child.path); // "_pages" 그대로 사용`}</pre>

          <div className={styles.table}>
            <div className={styles.tableRow}>
              <strong>`getLayers`</strong>
              <span>`_pages`를 `pages`로 정규화한다.</span>
            </div>
            <div className={styles.tableRow}>
              <strong>`forbidden-imports`</strong>
              <span>`getLayers` 결과를 사용하므로 정상 동작한다.</span>
            </div>
            <div className={styles.tableRow}>
              <strong>`typo-in-layer-name`</strong>
              <span>raw folder name을 봐서 `_pages`를 오탐한다.</span>
            </div>
          </div>
        </section>

        <section className={styles.section} id="probe">
          <p className={styles.stepNumber}>05</p>
          <h2>삭제 가능한 예제로 실제 검증</h2>
          <p>
            추론만으로 끝내지 않고, `__steiger-delete-me__` 예제를 잠시 만들어 두 가지 import 위반을
            직접 확인했습니다. 검증 후 예제 파일은 모두 삭제했습니다.
          </p>

          <div className={styles.probeGrid}>
            {probeResults.map((result) => (
              <article key={result.title}>
                <h3>{result.title}</h3>
                <pre>{result.code}</pre>
              </article>
            ))}
          </div>

          <pre className={styles.codeBlock}>{`pnpm --filter @repo/web lint:steiger
✔ No problems found!`}</pre>
        </section>

        <section className={styles.section} id="decision">
          <p className={styles.stepNumber}>06</p>
          <h2>최종 결정</h2>
          <div className={styles.table}>
            {conclusions.map(([title, description]) => (
              <div className={styles.tableRow} key={title}>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            ))}
          </div>

          <pre className={styles.codeBlock}>{`{
  files: ['**/_pages/**', '**/_app/**'],
  rules: {
    'fsd/typo-in-layer-name': 'off',
  },
}`}</pre>

          <div className={styles.note}>
            <strong>전역으로 끄지 않는 이유</strong>
            <p>
              `entites`, `widgest` 같은 진짜 레이어 오타는 계속 잡아야 합니다. 그래서 오탐이 확인된
              `_app`, `_pages` 경로에만 좁게 적용합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
