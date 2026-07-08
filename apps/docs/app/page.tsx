import Link from 'next/link';
import styles from './page.module.css';

const guideSteps = [
  {
    href: '/setting-guide#turborepo-next',
    index: '01',
    title: 'Turborepo + Next.js',
    detail: 'Next.js apps, workspace packages, turbo tasks',
  },
  {
    href: '/setting-guide#bridge-types',
    index: '02',
    title: 'Bridge shared types',
    detail: '@repo/types, web hooks, @repo/ui restore',
  },
  {
    href: '/setting-guide#expo-sdk-54',
    index: '03',
    title: 'Expo SDK 54 native app',
    detail: 'create-expo-app, SDK choice, generated files',
  },
  {
    href: '/setting-guide#webview-install',
    index: '04',
    title: 'react-native-webview',
    detail: 'Expo-compatible install and lockfile update',
  },
  {
    href: '/setting-guide#dev-servers',
    index: '05',
    title: 'Dev server policy',
    detail: 'web/docs through Turbo, native separately',
  },
  {
    href: '/setting-guide#webview-preview',
    index: '06',
    title: 'WebView preview',
    detail: 'native loads local Next.js and tests bridge messages',
  },
  {
    href: '/setting-guide#troubleshooting',
    index: '07',
    title: 'Troubleshooting',
    detail: 'Expo validation, cache, Node version, wrong cwd',
  },
  {
    href: '/git-hooks',
    index: '08',
    title: 'Git hook validation',
    detail: 'Husky, lint-staged, commitlint rules',
  },
  {
    href: '/frontend-styling',
    index: '09',
    title: 'Frontend styling',
    detail: 'Tailwind v4, Prettier class sorting, Next font',
  },
  {
    href: '/fsd-architecture',
    index: '10',
    title: 'FSD architecture',
    detail: 'Next App Router, aliases, public API, Steiger boundaries',
  },
  {
    href: '/steiger-prefixed-layers',
    index: '11',
    title: 'Steiger prefix layers',
    detail: '_app, _pages prefix layer troubleshooting',
  },
  {
    href: '/eas-build',
    index: '12',
    title: 'EAS Build',
    detail: '빌드 프로파일, 빌드 명령어, 개발 시 핫리로드',
  },
  {
    href: '/server-state-management',
    index: '13',
    title: 'Server state management',
    detail: 'TanStack Query provider, devtools, ESLint plugin',
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Project docs</p>
          <h1>Next.js + Expo WebView Turborepo 세팅 가이드</h1>
          <p>
            이 문서는 현재 레포지토리를 세팅하면서 실제로 실행한 명령어, 참고한 공식 문서, 발생한
            문제와 선택한 해결 방식을 순서대로 추적하기 위한 내부 가이드입니다.
          </p>
          <div className={styles.commands}>
            <code>pnpm dev</code>
            <code>pnpm dev:native</code>
            <code>pnpm --filter @repo/web check-types</code>
          </div>
        </div>
      </section>

      <section className={styles.guideList} aria-labelledby="guide-list-title">
        <div className={styles.sectionHeader}>
          <h2 id="guide-list-title">세팅 순서</h2>
          <Link href="/setting-guide" className={styles.fullGuideLink}>
            전체 가이드 보기
          </Link>
        </div>

        <div className={styles.cards}>
          {guideSteps.map((step) => (
            <Link href={step.href} className={styles.card} key={step.href}>
              <span>{step.index}</span>
              <strong>{step.title}</strong>
              <small>{step.detail}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
