import Link from 'next/link';
import styles from './git-hooks.module.css';

const installedPackages = [
  ['husky', 'Git hook 파일을 관리하고 commit 시점에 검증 명령을 실행합니다.'],
  ['lint-staged', 'staged 파일만 대상으로 Prettier와 ESLint를 실행합니다.'],
  ['@commitlint/cli', 'commit message를 commitlint 규칙으로 검사합니다.'],
  ['@commitlint/config-conventional', 'Conventional Commits 기반 기본 규칙을 제공합니다.'],
];

const generatedFiles = [
  ['.husky/pre-commit', 'commit 전에 staged 파일 포맷과 일부 ESLint 자동 수정을 실행합니다.'],
  ['.husky/commit-msg', 'commit message가 팀 컨벤션을 만족하는지 검사합니다.'],
  ['commitlint.config.js', '허용 type, scope, subject 규칙을 정의합니다.'],
  ['package.json', 'prepare script, lint-staged 설정, Git hook 관련 devDependencies를 관리합니다.'],
  ['pnpm-lock.yaml', 'Git hook 관련 패키지 resolution을 고정합니다.'],
];

const commitTypes = [
  'feat',
  'fix',
  'docs',
  'style',
  'design',
  'refactor',
  'test',
  'perf',
  'build',
  'ci',
  'chore',
  'rename',
  'remove',
  'init',
  'revert',
];

const scopes = ['web', 'native', 'docs', 'shared', 'config', 'repo', 'storybook'];

const validMessages = [
  'feat(web): 로그인 페이지 구현',
  'fix(native): 웹뷰 로딩 오류 수정',
  'refactor(shared): 버튼 컴포넌트 구조 개선',
  'chore(config): ESLint 설정 추가',
  'docs: README 작성',
  'init: 프로젝트 초기 세팅',
];

const lintStagedRules = [
  ['apps/**/*.{js,jsx,ts,tsx}', '앱 코드에 ESLint 자동 수정 후 Prettier 포맷을 적용합니다.'],
  [
    'packages/**/*.{js,jsx,ts,tsx}',
    '공통 패키지 코드에 ESLint 자동 수정 후 Prettier 포맷을 적용합니다.',
  ],
  [
    '*.{js,mjs,json,md,mdx,yml,yaml,css}',
    '루트 설정 파일과 문서/스타일 파일은 Prettier만 적용합니다.',
  ],
];

export default function GitHooksPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Git hooks</p>
          <h1 className={styles.heading}>Husky + lint-staged + commitlint 설정 기록</h1>
          <p>
            이 문서는 Git hook 검증을 구성하면서 실행한 명령어, 생성한 파일, pre-commit과 commit-msg
            단계에서 적용되는 규칙을 정리한 작업 기록입니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Git hook guide sections">
          <a href="#install">Install</a>
          <a href="#files">Files</a>
          <a href="#pre-commit">pre-commit</a>
          <a href="#commit-msg">commit-msg</a>
          <a href="#rules">Rules</a>
          <a href="#troubleshooting">Troubleshooting</a>
        </nav>

        <section className={styles.section} id="install">
          <h2>설치 명령어</h2>
          <p>
            Git hook은 특정 앱이 아니라 레포지토리 전체 commit 흐름에 적용되므로 workspace root에
            devDependency로 설치했습니다. pnpm workspace에서는 루트 설치 의도를 명시하기 위해 `-w`
            옵션을 사용합니다.
          </p>
          <pre className={styles.codeBlock}>{`pnpm add -D -w husky lint-staged
pnpm add -D -w @commitlint/cli @commitlint/config-conventional
pnpm exec husky init`}</pre>

          <div className={styles.table}>
            {installedPackages.map(([name, description]) => (
              <div className={styles.tableRow} key={name}>
                <code>{name}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="files">
          <h2>생성 및 수정 파일</h2>
          <div className={styles.table}>
            {generatedFiles.map(([path, description]) => (
              <div className={styles.tableRow} key={path}>
                <code>{path}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="pre-commit">
          <h2>pre-commit hook</h2>
          <p>
            commit 직전에 `lint-staged`를 실행합니다. staged 파일만 대상으로 처리하므로 전체
            레포지토리를 매번 검사하는 것보다 빠르고, 실제 commit에 포함되는 파일만 자동 수정합니다.
          </p>
          <pre className={styles.codeBlock}>{`# .husky/pre-commit
pnpm exec lint-staged`}</pre>

          <div className={styles.table}>
            {lintStagedRules.map(([pattern, description]) => (
              <div className={styles.tableRow} key={pattern}>
                <code>{pattern}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="commit-msg">
          <h2>commit-msg hook</h2>
          <p>
            commit message 작성 후 `commitlint`를 실행합니다. hook 파일은 Git Bash에서 실행되므로
            Windows에서도 BOM 없는 UTF-8로 저장해야 합니다.
          </p>
          <pre className={styles.codeBlock}>{`# .husky/commit-msg
pnpm exec commitlint --edit "$1"`}</pre>
        </section>

        <section className={styles.section} id="rules">
          <h2>커밋 메시지 규칙</h2>
          <p>
            기본 규칙은 `@commitlint/config-conventional`을 확장하고, 팀에서 사용하는 type과 scope를
            명시적으로 허용했습니다. 한국어 subject와 `README`, `ESLint` 같은 대문자 단어를
            자연스럽게 사용하기 위해 `subject-case` 규칙은 비활성화했습니다.
          </p>

          <div className={styles.ruleGrid}>
            <article>
              <h3>허용 type</h3>
              <div className={styles.badges}>
                {commitTypes.map((type) => (
                  <code key={type}>{type}</code>
                ))}
              </div>
            </article>
            <article>
              <h3>허용 scope</h3>
              <div className={styles.badges}>
                {scopes.map((scope) => (
                  <code key={scope}>{scope}</code>
                ))}
              </div>
            </article>
          </div>

          <h3 className={styles.subheading}>예시</h3>
          <ul className={styles.examples}>
            {validMessages.map((message) => (
              <li key={message}>
                <code>{message}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} id="troubleshooting">
          <h2>문제 해결 기록</h2>
          <div className={styles.notes}>
            <article>
              <h3>루트 ESLint config 탐색 실패</h3>
              <p>
                <code>
                  *.{'{'}js,mjs,ts,tsx{'}'}
                </code>{' '}
                전체에 <code>eslint --fix</code>를 걸면 루트의 <code>commitlint.config.js</code>도
                ESLint 대상이 됩니다. 루트에는 ESLint config가 없으므로, ESLint는{' '}
                <code>apps/**</code>, <code>packages/**</code> 코드에만 적용하고 루트 설정 파일은
                Prettier만 적용하도록 분리했습니다.
              </p>
            </article>
            <article>
              <h3>Husky 파일 BOM 문제</h3>
              <p>
                PowerShell `Set-Content -Encoding utf8` 또는 redirection으로 hook 파일을 만들면
                BOM이 들어갈 수 있습니다. Git Bash는 BOM이 붙은 `pnpm`을 명령어로 인식하지 못하므로
                hook 파일은 UTF-8 without BOM으로 저장했습니다.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
