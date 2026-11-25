# 백로그 — 작업 중 발견한 범위 밖 문제

작업하다 발견했지만 그 자리에서 고치지 않은 것들. 규칙은 `.claude/rules/work-record.md` §3.
처리했거나 GitHub 이슈로 옮겼으면 체크하고 이슈 번호를 붙인다.

형식: `- [ ] YYYY-MM-DD · 무엇이 문제인가 (근거) · 발견: 작업 ID`

---

## 하네스 기준과 다른 기존 코드 (2026-11-25, 발견: INFRA-harness-rules)

기준은 `.claude/rules/`다. 아래는 **기준이 맞고 코드가 틀린** 항목이다.
대부분 구조 이전이라 `REF` 작업으로 묶어 처리한다.

### 구조 (REF)

- [ ] `shared/model/` 브릿지 파일 → `shared/api/bridge/` (`fsd-shared.md` §1) — 브릿지 손보기(5번)와 같이 하면 좋다
- [ ] `shared/model/` 훅 `back-handler`·`submission-lock` → `shared/lib/` 또는 `_app` 프로바이더 (`fsd-shared.md` §1, `state-convention.md` §2)
- [ ] `shared/assets/icons` → `shared/ui/icon/` 안, `images`·`illustrations` → 쓰는 곳 옆 (`fsd-shared.md` §1). `scripts/generate-icons.mjs` 입력 경로도 함께
- [ ] `shared/lib/render-with-query.tsx` → `shared/lib/testing/` (`fsd-shared.md` §1)
- [ ] entity Query 훅 `entities/*/model/use-*-query.ts` → `entities/*/api/` (`fsd-entities.md` §2, `api-convention.md` §4)
- [ ] feature mutation 훅 `features/meeting/*/model/use-*.ts` → `api/` (`fsd-features.md` §2)
- [ ] **(확정)** `features/meeting/*` slice group → 평평한 `features/meeting-*` 10개, import 69곳/52파일. 매핑은 `fsd-features.md` §1. 이전 후 훅의 group 인식 제거. `dev-auth`·`onboarding`·`social-login` 이름도 같은 작업에서 판단
- [ ] draft store 이름 `create-meeting-draft.ts`/`useCreateMeetingDraft` 등 → `{slice}-store.ts`/`use{Slice}Store` (`state-convention.md` §2)
- [ ] 일부 라우트(`app/(protected)/meetings/[meetingId]/invite/page.tsx` 등)가 화면 조립을 라우트 파일에서 함 → `_pages`로 위임 (`fsd-pages.md` §1)

### 동작·경계 (FIX / REF)

- [ ] `create-meeting` 스텝 컴포넌트 7곳 `useCreateMeetingDraft()` 전체 구독 → selector (`state-convention.md` §3)
- [ ] entity `MeetingCard`가 직접 `router.push` → 위젯이 `MeetingCardView` + `onClick` (`fsd-entities.md` §3)
- [ ] widget `ConfirmedMeetingSection`이 직접 `router.push` → `onSelect`로 올리고 `_pages/home`이 이동 (`fsd-widgets.md` §4·§6)
- [ ] `Button`이 `asChild`면 로딩을 조용히 끔 → props 배타 유니온으로 컴파일 시점 차단 (`component-convention.md` §11)

### 설정 (INFRA)

- [ ] `verbatimModuleSyntax: true` 켜기 + 기존 type import 정리 (`import-convention.md` §4)
- [ ] `src/test-setup.ts`에 `vi.restoreAllMocks()` 추가 — 기존 테스트가 서로의 mock에 기대는지 확인 (`test-policy.md` §3)
- [ ] `shared/config/` 만들고 흩어진 `process.env.NEXT_PUBLIC_*` 읽기를 모으기 (`fsd-shared.md` §4, `constants-convention.md`)
- [ ] `Thumbnail` 원격 이미지 `unoptimized` → `images.remotePatterns` 등록 후 최적화 (`image-convention.md` §1)
- [ ] 이슈 #234(`next.config.js` `process` no-undef)는 현재 `pnpm lint`에서 재현되지 않는다 — 이미 해소됐다면 이슈 닫기
- [ ] `radix-ui`와 `@base-ui/react`(toast만 사용) 중복 정리 여부 결정 (`component-convention.md` §3)
