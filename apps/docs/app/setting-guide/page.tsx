import Link from "next/link";
import styles from "./setting-guide.module.css";

const references = [
  {
    label: "Turborepo Next.js guide",
    href: "https://turborepo.dev/docs/guides/frameworks/nextjs",
  },
  {
    label: "Expo create-expo-app",
    href: "https://docs.expo.dev/more/create-expo/",
  },
  {
    label: "Expo SDK 54 reference",
    href: "https://docs.expo.dev/versions/v54.0.0/",
  },
  {
    label: "Expo SDK 54 react-native-webview",
    href: "https://docs.expo.dev/versions/v54.0.0/sdk/webview/",
  },
];

const structure = [
  ["apps/web", "Next.js 16 WebView 화면. Expo WebView 안에서 로드되는 실제 웹 앱."],
  ["apps/native", "Expo SDK 54 React Native 앱. react-native-webview로 apps/web을 로드."],
  ["apps/docs", "세팅 순서, 명령어, 의사결정, 문제 해결 기록."],
  ["packages/types", "NativeToWebMessage, WebToNativeMessage 공유 타입."],
  ["packages/ui", "Next 앱에서 재사용 가능한 UI 컴포넌트 패키지."],
  ["packages/typescript-config", "base, nextjs, react-library TypeScript 설정."],
  ["packages/prettier-config", "workspace용 Prettier config placeholder."],
];

const commands = [
  ["루트 Next 앱 실행", "pnpm dev"],
  ["native 앱 실행", "pnpm dev:native"],
  ["native 직접 실행", "cd apps/native\nnpx expo start --clear"],
  ["Expo validation 우회", "EXPO_NO_DEPENDENCY_VALIDATION=1 npx expo start --clear"],
  ["web 타입체크", "pnpm --filter @repo/web check-types"],
  ["native lint", "pnpm --filter native lint"],
];

export default function SettingGuidePage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Setup guide</p>
          <h1>Next.js + RN WebView Turborepo 세팅 기록</h1>
          <p>
            이 문서는 현재 레포지토리를 다시 세팅하거나 문제를 추적할 때 필요한 순서,
            명령어, 참고 URL, 의사결정을 한 곳에 모아둔 작업 기록입니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="Setting guide sections">
          <a href="#turborepo-next">01 Turborepo + Next.js</a>
          <a href="#bridge-types">02 Bridge types</a>
          <a href="#expo-sdk-54">03 Expo SDK 54</a>
          <a href="#webview-install">04 WebView install</a>
          <a href="#dev-servers">05 Dev servers</a>
          <a href="#webview-preview">06 WebView preview</a>
          <a href="#troubleshooting">07 Troubleshooting</a>
          <a href="#commands">Commands</a>
        </nav>

        <section className={styles.section} id="current-structure">
          <h2>현재 구조</h2>
          <div className={styles.structure}>
            {structure.map(([path, description]) => (
              <div className={styles.structureRow} key={path}>
                <code>{path}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="turborepo-next">
          <p className={styles.stepNumber}>01</p>
          <h2>Turborepo + Next.js workspace</h2>
          <p>
            Turborepo의 Next.js framework guide를 기준으로 `apps/*`와 `packages/*`
            구조를 유지했습니다. `apps/web`은 WebView에 들어갈 Next.js 앱이고,
            `apps/docs`는 세팅 기록을 남기는 Next.js 앱입니다.
          </p>
          <ul className={styles.list}>
            <li>참고 문서: https://turborepo.dev/docs/guides/frameworks/nextjs</li>
            <li>`pnpm-workspace.yaml`은 `apps/*`, `packages/*`를 workspace로 포함합니다.</li>
            <li>`turbo.json`의 `dev` task는 `cache: false`, `persistent: true`로 dev server를 다룹니다.</li>
            <li>`@repo/typescript-config`는 `./nextjs`와 `./nextjs.json` export를 모두 열어 앱 tsconfig가 resolve되도록 했습니다.</li>
          </ul>
          <pre className={styles.codeBlock}>{`pnpm dlx create-turbo@latest
pnpm install
pnpm dev`}</pre>
        </section>

        <section className={styles.section} id="bridge-types">
          <p className={styles.stepNumber}>02</p>
          <h2>WebView bridge 공유 타입</h2>
          <p>
            RN과 WebView가 주고받는 메시지를 먼저 `packages/types`에 고정했습니다.
            web 앱은 `@repo/types`로 메시지 계약을 가져오고, `use-bridge.ts`에서
            송신과 수신 hook을 제공합니다.
          </p>
          <ul className={styles.list}>
            <li>`NativeToWebMessage`: native가 web에 보내는 인증, 디바이스, 앱 상태 메시지.</li>
            <li>`WebToNativeMessage`: web이 native에 요청하는 READY, 카메라, 햅틱, native navigation, permission 메시지.</li>
            <li>`apps/web`은 `@repo/types`와 `@repo/ui`를 모두 사용하므로 둘 다 dependencies에 유지합니다.</li>
            <li>`@repo/ui`가 빠졌을 때 `@repo/ui/button` import 에러가 발생했고, `apps/web/package.json`에 다시 추가했습니다.</li>
          </ul>
        </section>

        <section className={styles.section} id="expo-sdk-54">
          <p className={styles.stepNumber}>03</p>
          <h2>apps/native Expo SDK 54 생성</h2>
          <p>
            Expo 공식 `create-expo-app` 문서를 기준으로 `apps` 디렉터리 아래에서
            native 앱을 생성했습니다. 처음에는 `apps/native/.gitkeep` 때문에 대상
            폴더가 이미 존재했으므로, Expo 앱이 실제 생성되지 않고 placeholder만 남은
            상태를 확인했습니다. 이후 실제 Expo 프로젝트 파일이 생성되면서 `.gitkeep`은 제거했습니다.
          </p>
          <pre className={styles.codeBlock}>{`cd apps
pnpm create expo-app native`}</pre>
          <ul className={styles.list}>
            <li>참고 문서: https://docs.expo.dev/more/create-expo/</li>
            <li>생성 결과: `expo ~54.0.34`, `react-native 0.81.5`.</li>
            <li>기본 템플릿에는 Expo Router, TypeScript, assets, AGENTS.md, CLAUDE.md가 포함됐습니다.</li>
            <li>SDK 56 대신 SDK 54를 사용한 이유는 create-expo-app 문서의 SDK 56 전환기 안내와 Expo Go 실기기 검증 흐름 때문입니다.</li>
            <li>SDK 54 문서 기준: https://docs.expo.dev/versions/v54.0.0/</li>
          </ul>
        </section>

        <section className={styles.section} id="webview-install">
          <p className={styles.stepNumber}>04</p>
          <h2>apps/native에 react-native-webview 설치</h2>
          <p>
            Expo SDK 54에 맞는 native module 버전을 받기 위해 직접 버전을 고르지 않고
            Expo install 명령을 사용했습니다. 설치 결과 `react-native-webview 13.15.0`이
            `apps/native/package.json`에 추가됐습니다.
          </p>
          <pre className={styles.codeBlock}>{`cd apps/native
pnpm expo install react-native-webview`}</pre>
          <ul className={styles.list}>
            <li>참고 문서: https://docs.expo.dev/versions/v54.0.0/sdk/webview/</li>
            <li>`pnpm-lock.yaml`에는 Expo SDK 54와 React Native 0.81.5에 맞는 resolution이 반영됐습니다.</li>
            <li>이 단계는 나중에 native shell이 `apps/web`의 Next.js 화면을 로드하기 위한 기반입니다.</li>
          </ul>
        </section>

        <section className={styles.section} id="dev-servers">
          <p className={styles.stepNumber}>05</p>
          <h2>개발 서버 실행 방식</h2>
          <p>
            처음에는 `apps/native`에도 `dev` script를 추가해서 루트 `pnpm dev`가
            web, docs, native를 모두 실행하게 했습니다. 하지만 Expo는 QR, Expo Go,
            Metro command, device 연결이 있는 interactive dev server라 Turborepo TUI 안에
            묶는 것보다 별도 터미널에서 실행하는 편이 안정적이었습니다.
          </p>
          <ul className={styles.list}>
            <li>현재 `pnpm dev`: `apps/web`, `apps/docs`만 실행.</li>
            <li>현재 `pnpm dev:native`: `pnpm --filter native start`로 Expo를 별도 실행.</li>
            <li>`apps/native/package.json`에서는 `dev` script를 제거하고 `start: expo start`만 유지합니다.</li>
          </ul>
          <pre className={styles.codeBlock}>{`pnpm dev
pnpm dev:native`}</pre>
        </section>

        <section className={styles.section} id="webview-preview">
          <p className={styles.stepNumber}>06</p>
          <h2>WebView preview 연결</h2>
          <p>
            Expo starter tab 화면을 `react-native-webview` 화면으로 교체해서 개발 중인
            `apps/web` Next.js 화면이 실제 native WebView 안에서 뜨는지 확인했습니다.
          </p>
          <ul className={styles.list}>
            <li>`apps/native/app/(tabs)/index.tsx`는 `WebView`로 로컬 Next dev server URL을 로드합니다.</li>
            <li>`apps/web/app/page.tsx`는 모여 WebView 확인 화면으로 바꾸고 bridge 테스트 버튼을 제공합니다.</li>
            <li>WebView 내부에서는 `window.ReactNativeWebView.postMessage`로 native에 메시지를 보냅니다.</li>
            <li>현재 local URL은 개발 PC의 LAN IP를 사용하는 확인용 값입니다. 추후 환경별 config로 분리해야 합니다.</li>
          </ul>
        </section>

        <section className={styles.section} id="troubleshooting">
          <p className={styles.stepNumber}>07</p>
          <h2>문제 해결 기록</h2>
          <div className={styles.notes}>
            <article>
              <h3>TypeScript JSX 설정 누락</h3>
              <p>
                `@repo/typescript-config/nextjs.json` 경로가 package exports에 없어서
                앱 tsconfig가 공유 설정을 못 읽었고, JSX compiler option이 없다는 경고가
                발생했습니다. `./nextjs.json` export를 추가해 해결했습니다.
              </p>
            </article>
            <article>
              <h3>Expo dependency validation 에러</h3>
              <p>
                `Body is unusable: Body has already been read`는 Metro 코드 문제가 아니라
                Expo CLI가 SDK별 native module version 목록을 네트워크로 조회하는 validation
                단계에서 발생했습니다. 임시 우회는 `EXPO_NO_DEPENDENCY_VALIDATION=1`입니다.
              </p>
            </article>
            <article>
              <h3>잘못된 위치에서 npx expo start 실행</h3>
              <p>
                루트에서 `npx expo start --clear`를 실행하면 루트를 Expo 프로젝트로 착각해서
                루트 `tsconfig.json`을 자동 생성할 수 있습니다. native 앱은 반드시
                `apps/native`에서 실행하거나 `pnpm --filter native start --clear`를 사용합니다.
              </p>
            </article>
            <article>
              <h3>Node 버전</h3>
              <p>
                현재 Node 24 계열에서는 Expo CLI 54의 fetch/undici 경로와 맞물려 validation
                문제가 반복될 수 있습니다. 반복되면 Node 22 LTS 사용을 우선 검토합니다.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section} id="commands">
          <h2>자주 쓰는 명령어</h2>
          <div className={styles.commandGrid}>
            {commands.map(([label, command]) => (
              <div className={styles.command} key={label}>
                <strong>{label}</strong>
                <pre>{command}</pre>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="references">
          <h2>참고 URL</h2>
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
