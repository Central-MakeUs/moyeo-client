import Link from 'next/link';
import styles from './eas-build.module.css';

const profiles = [
  {
    name: 'development',
    tag: 'Debug',
    usage: '실기기에서 핫리로드 개발',
    dist: '내부 배포 (APK / IPA)',
    note: 'expo-dev-client 포함, Expo Dev Client 앱 필요',
  },
  {
    name: 'preview',
    tag: 'Release',
    usage: '팀 내부 테스트 배포',
    dist: '내부 배포 (APK / IPA)',
    note: '스토어 제출 없이 실기기 설치',
  },
  {
    name: 'production',
    tag: 'Release',
    usage: '스토어 제출용 최종 빌드',
    dist: 'Store (AAB / IPA)',
    note: 'autoIncrement로 버전 자동 증가',
  },
];

const buildCommands = [
  ['Android development', 'pnpm --filter native build:android:dev'],
  ['Android preview', 'pnpm --filter native build:android:preview'],
  ['Android production', 'pnpm --filter native build:android:prod'],
  ['iOS development', 'pnpm --filter native build:ios:dev'],
  ['iOS preview', 'pnpm --filter native build:ios:preview'],
  ['iOS production', 'pnpm --filter native build:ios:prod'],
  ['Android + iOS development', 'pnpm --filter native build:all:dev'],
];

const androidSteps = [
  '설정 → 보안 → 출처를 알 수 없는 앱 허용',
  'Google Play Protect 일시 중단 (Play 스토어 → 프로필 → Play Protect → 설정)',
  'EAS에서 제공하는 링크 또는 QR로 APK 다운로드 후 설치',
];

const iosSteps = [
  '빌드 전 EAS에 기기 UDID 등록: eas device:create',
  'EAS에서 제공하는 링크 또는 QR로 IPA 다운로드 후 설치',
  '설정 → 일반 → VPN 및 기기 관리 → 개발자 앱 신뢰',
  '설정 → 개인 정보 보호 및 보안 → 개발자 모드 활성화',
];

export default function EasBuildPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          Docs home
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>EAS Build</p>
          <h1 className={styles.heading}>EAS Build 온보딩 가이드</h1>
          <p>
            Expo Application Services(EAS)를 통해 Android / iOS 앱을 클라우드에서 빌드합니다. 로컬
            환경에 Xcode나 Android Studio 없이도 빌드할 수 있고, 빌드 결과물을 팀원에게 바로 공유할
            수 있습니다.
          </p>
        </header>

        <nav className={styles.toc} aria-label="EAS Build guide sections">
          <a href="#prerequisites">사전 준비</a>
          <a href="#profiles">빌드 프로파일</a>
          <a href="#commands">빌드 명령어</a>
          <a href="#install">빌드 결과물 설치</a>
          <a href="#dev-workflow">개발 시 실행 방법</a>
        </nav>

        <section className={styles.section} id="prerequisites">
          <h2>사전 준비</h2>
          <p>EAS CLI를 설치하고 팀 Expo 계정으로 로그인합니다.</p>
          <pre className={styles.codeBlock}>{`npm install -g eas-cli
eas login`}</pre>
          <div className={styles.callout}>
            <strong>계정 확인</strong>
            <p>
              로그인에는 <code>@moyeozo</code> org의 멤버 계정이 필요합니다. 로그인 후{' '}
              <code>eas whoami</code>로 확인하세요.
            </p>
          </div>
        </section>

        <section className={styles.section} id="profiles">
          <h2>빌드 프로파일</h2>
          <p>
            <code>eas.json</code>에 세 가지 프로파일이 정의되어 있습니다. 상황에 맞는 프로파일을
            선택해 빌드하세요.
          </p>
          <div className={styles.profileGrid}>
            {profiles.map((p) => (
              <article key={p.name} className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <code className={styles.profileName}>{p.name}</code>
                  <span className={styles.tag}>{p.tag}</span>
                </div>
                <p className={styles.profileUsage}>{p.usage}</p>
                <div className={styles.profileMeta}>
                  <span>{p.dist}</span>
                  <small>{p.note}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="commands">
          <h2>빌드 명령어</h2>
          <p>
            빌드는 EAS 클라우드에서 실행됩니다. 명령어를 실행하면 빌드 URL이 출력되고 완료 시 알림을
            받을 수 있습니다.
          </p>
          <div className={styles.table}>
            {buildCommands.map(([label, cmd]) => (
              <div className={styles.tableRow} key={label}>
                <span>{label}</span>
                <code>{cmd}</code>
              </div>
            ))}
          </div>
          <div className={styles.warning}>
            <strong>빌드 전 확인</strong>
            <p>
              EAS 플랜에는 월간 빌드 횟수 제한이 있습니다. 불필요한 빌드를 피하고, 코드 변경이
              확정된 후에 빌드를 실행하세요.
            </p>
          </div>
        </section>

        <section className={styles.section} id="install">
          <h2>빌드 결과물 설치</h2>
          <p>
            빌드 완료 후 EAS 대시보드 또는 터미널에 출력된 링크에서 결과물을 받아 기기에 설치합니다.
            플랫폼마다 사전 설정이 필요합니다.
          </p>

          <div className={styles.installGrid}>
            <article className={styles.installCard}>
              <h3>Android</h3>
              <ol className={styles.stepList}>
                {androidSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
            <article className={styles.installCard}>
              <h3>iOS</h3>
              <ol className={styles.stepList}>
                {iosSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </div>

          <div className={styles.callout}>
            <strong>공통 — 같은 와이파이 환경 필요</strong>
            <p>
              개발 서버(Next.js + Expo Dev Client)와 기기가 같은 네트워크에 있어야 연결됩니다. 다른
              네트워크에서는 QR 코드를 찍어도 앱이 서버를 찾지 못합니다.
            </p>
          </div>
        </section>

        <section className={styles.section} id="dev-workflow">
          <h2>개발 시 실행 방법</h2>
          <p>
            실기기에서 핫리로드를 사용하려면 터미널 두 개를 동시에 실행해야 합니다. 웹 서버가 없으면
            WebView가 빈 화면을 표시합니다.
          </p>

          <div className={styles.terminalGrid}>
            <article className={styles.terminalCard}>
              <p className={styles.terminalLabel}>터미널 1 — 웹 서버</p>
              <pre className={styles.codeBlock}>{`pnpm --filter @repo/web dev`}</pre>
              <p className={styles.terminalNote}>Next.js 개발 서버를 3000번 포트로 실행합니다.</p>
            </article>
            <article className={styles.terminalCard}>
              <p className={styles.terminalLabel}>터미널 2 — Expo Dev Client</p>
              <pre className={styles.codeBlock}>{`expo start --dev-client`}</pre>
              <p className={styles.terminalNote}>
                QR 코드를 찍거나 단축키로 실기기에 연결합니다. development 프로파일로 빌드한 앱이
                기기에 설치되어 있어야 합니다.
              </p>
            </article>
          </div>

          <div className={styles.callout}>
            <strong>development 빌드가 없다면</strong>
            <p>
              처음 개발 환경을 세팅할 때는 <code>build:android:dev</code> 또는{' '}
              <code>build:ios:dev</code>로 development 빌드를 먼저 기기에 설치해야 합니다. 이후에는
              JS 변경 시 앱 재설치 없이 핫리로드됩니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
