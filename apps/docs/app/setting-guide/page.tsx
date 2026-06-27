import Link from "next/link";
import styles from "./setting-guide.module.css";

const setupSteps = [
  {
    title: "1. Turborepo + Next.js workspace",
    body: "Turborepo의 Next.js framework guide 흐름을 따라 apps/web과 apps/docs를 Next.js 앱으로 두고, packages/*를 공유 패키지 영역으로 유지했다.",
    items: [
      "루트 package.json은 turbo run build/dev/lint/check-types를 실행한다.",
      "pnpm-workspace.yaml은 apps/*와 packages/*를 workspace로 포함한다.",
      "turbo.json은 Next.js 빌드 산출물(.next/**)과 .env* 입력을 기준으로 캐시 범위를 잡는다.",
    ],
  },
  {
    title: "2. WebView bridge 공유 타입",
    body: "React Native WebView와 Next.js 웹 앱 사이에서 오가는 메시지를 먼저 타입으로 고정했다.",
    items: [
      "packages/types에서 NativeToWebMessage와 WebToNativeMessage를 export한다.",
      "apps/web은 @repo/types를 workspace dependency로 참조한다.",
      "apps/web/shared/model/use-bridge.ts는 postMessage 송신과 message 이벤트 수신 hook을 제공한다.",
    ],
  },
  {
    title: "3. apps/native Expo SDK 54 생성",
    body: "공식 create-expo-app 문서를 기준으로 apps 디렉터리 아래에서 native 앱을 생성했다.",
    items: [
      "실행 위치: apps",
      "실행 명령: pnpm create expo-app native",
      "생성 결과: apps/native/package.json의 expo 버전은 ~54.0.34, react-native 버전은 0.81.5이다.",
      "create-expo-app 기본 템플릿이 포함하는 Expo Router, TypeScript 설정, AGENTS.md, CLAUDE.md, VS Code 권장 설정이 함께 생성됐다.",
    ],
  },
  {
    title: "4. apps/native에 react-native-webview 설치",
    body: "Expo SDK 54가 권장하는 native module 버전을 맞추기 위해 native 앱 위치에서 Expo install 명령을 사용했다.",
    items: [
      "실행 위치: apps/native",
      "실행 명령: pnpm expo install react-native-webview",
      "설치 결과: apps/native/package.json에 react-native-webview 13.15.0이 추가됐다.",
      "pnpm-lock.yaml에는 Expo SDK 54와 React Native 0.81.5 조합에 맞는 resolution이 반영됐다.",
    ],
  },
];

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
    label: "Expo SDK 54 changelog",
    href: "https://expo.dev/changelog/sdk-54",
  },
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
            이 문서는 현재 레포지토리의 초기 세팅 순서를 다시 따라갈 수 있도록 남긴 작업
            기록이다. Next.js 웹 앱, 공유 bridge 타입, Expo native 앱 생성까지를 같은
            workspace 안에서 관리하는 방향으로 정리했다.
          </p>
        </header>

        <section className={styles.section} aria-labelledby="current-state">
          <h2 id="current-state">현재 구조</h2>
          <div className={styles.structure}>
            <code>apps/web</code>
            <span>Next.js WebView 화면</span>
            <code>apps/native</code>
            <span>Expo SDK 54 React Native 앱</span>
            <code>apps/docs</code>
            <span>세팅 문서와 프로젝트 가이드</span>
            <code>packages/types</code>
            <span>RN-Web bridge 공유 타입</span>
            <code>packages/typescript-config</code>
            <span>공유 TypeScript 설정</span>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="steps">
          <h2 id="steps">진행 순서</h2>
          <div className={styles.steps}>
            {setupSteps.map((step) => (
              <article key={step.title} className={styles.step}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <ul>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sdk-choice">
          <h2 id="sdk-choice">Expo SDK 54를 선택한 이유</h2>
          <p>
            현재 Expo 공식 create-expo-app 문서는 SDK 56 전환기 기준으로, 템플릿을 명시하지
            않고 생성하면 SDK 54 프로젝트가 만들어진다고 안내한다. 또한 실기기에서 Expo Go를
            사용할 계획이라면 SDK 54 프로젝트를 사용하라고 안내한다.
          </p>
          <p>
            이 레포는 아직 native 기능을 깊게 붙이기 전이고, RN WebView bridge의 구조를 먼저
            안정화하는 단계다. 그래서 최신 SDK 56의 변화까지 바로 흡수하기보다, 공식 문서의
            전환기 기본값이면서 Expo Go 검증 흐름에 맞는 SDK 54를 기준으로 시작했다.
          </p>
          <p>
            SDK 54는 React Native 0.81 계열을 포함하고, pnpm 프로젝트 생성 시 hoisted
            node-linker를 기본으로 맞춰주는 흐름도 공식 문서에 정리되어 있다. 이 선택은 추후
            SDK 56 이상으로 올리지 않겠다는 의미가 아니라, 초기 WebView 통신 구조와
            workspace 의존성 연결을 먼저 안정적으로 고정하기 위한 기준점이다.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="dev-scripts">
          <h2 id="dev-scripts">개발 서버 실행 방식</h2>
          <p>
            루트의 <code>pnpm dev</code>는 Next.js 기반의 <code>apps/web</code>과{" "}
            <code>apps/docs</code>만 실행한다. 두 앱은 Turborepo의 persistent dev task와 잘
            맞고, 각각 3000번과 3001번 포트에서 동작한다.
          </p>
          <p>
            Expo native 앱은 QR 코드, Expo Go 연결, Metro 인터랙션, 기기 상태 확인이 필요하므로
            루트 dev task에 묶지 않는다. native는 별도 터미널에서 <code>pnpm dev:native</code>
            또는 <code>cd apps/native</code> 후 <code>npx expo start</code>로 실행한다.
          </p>
          <p>
            이 분리는 Expo CLI의 dependency validation 결과를 숨기지 않으면서, WebView 화면과
            문서 앱은 Turborepo로 빠르게 함께 띄우기 위한 선택이다.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="next">
          <h2 id="next">다음에 결정할 것</h2>
          <ul className={styles.nextList}>
            <li>native 앱 이름과 slug를 최종 서비스명으로 바꿀지 결정한다.</li>
            <li>@repo/types 기반 bridge를 native 쪽 WebView 화면에 연결한다.</li>
            <li>Next.js 앱을 WebView 전용 화면으로 정리하고 RN에서 로드할 URL 전략을 정한다.</li>
            <li>Expo SDK 56 업그레이드는 Expo Go, EAS Build, WebView 의존성 검증 후 별도 작업으로 진행한다.</li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="references">
          <h2 id="references">참고 문서</h2>
          <ul className={styles.referenceList}>
            {references.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href} target="_blank" rel="noreferrer">
                  {reference.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
