# 모임 생성 위저드 — 공통 계층 PRD

> 단일 기준 문서. 이 기능(공통 계층)에 대해 궁금하면 여기부터 본다.
> 요구사항 확정본은 [`spec-fixed.md`](./spec-fixed.md), 화면별 UI는 `docs/fe-implement-spec/create/`.
> **이번 사이클 범위 = CRT-01~06 (draft 누적 + 라우팅 + 가드 + Bridge 도달, 제출 없음).**
>
> **🔄 2026-07-27 기획 변경 반영.** 모임 유형 선택이 HOME FAB Drawer로 이동하고 기본 정보와 번호가 교체됐다
> (신 CRT-01 = 모임 유형 Drawer, 신 CRT-02 = 기본 정보). 유형 선택은 위저드 스텝이 아니다 → 진행률 분모 제외.

## 1. 개요

모임장이 CRT-01~06을 순서대로 걸어가며 입력값을 클라이언트 `CreateMeetingDraft`에 누적하는 멀티스텝
위저드의 **공통 계층**(라우팅·상태·가드·진행률)을 구현한다. 개별 화면 UI는 각 crt-0X 문서가, 화면을 잇는
뼈대는 이 문서가 책임진다. 최종 제출·host 입력은 다음 사이클.

## 2. 사용자 스토리

- 모임장으로서, 홈의 `+` 버튼을 눌러 무엇을 조율할지(일정/장소/둘 다) 먼저 고르고 모임 만들기를 시작하고 싶다.
- 모임장으로서, 이름을 넣으면 다음으로 갈 수 있고, 중간에 뒤로 갔다 와도 입력이 남아 있길 원한다.
- 모임장으로서, 위치만 정하는 모임이면 시간 범위 단계를 건너뛰고 싶다.
- 모임장으로서, 새로고침해도 지금까지 넣은 값이 날아가지 않길 원한다.
- 모임장으로서, 주소창으로 중간 단계에 바로 들어가면 안 채운 앞 단계로 돌려보내지길 원한다.

## 3. 기술 결정 (ADR)

### 3-0. 결정 근거 요약 (spec-fixed에서 확정, ADR로 기록)

아래는 단계 1에서 이미 확정된 것으로, 3안 비교 없이 결정·트레이드오프만 남긴다.

| #   | 결정                            | 요지                            | Consequences (트레이드오프)                                                                   |
| --- | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------- |
| A1  | 스텝=라우트 (후보 A)            | 각 스텝을 URL로 분리            | ➕ WebView 백버튼·history 정합, 스텝 식별 가능 ➖ 중간 URL 직접 접근 → 가드 필수              |
| A2  | 단일 `CreateMeetingDraft` store | 스텝별 분리 안 함               | ➕ 완성도/파생 계산 한 곳 ➖ store가 커짐(selector로 분할 대응)                               |
| A3  | persist = sessionStorage        | 새로고침/직접접근 생존          | ➕ 1회성 세션 성격에 맞음 ➖ WebView 세션 유지 방식 따라 유실 가능 → localStorage 재검토 여지 |
| A4  | 내부 타입 = 서버 enum 직접      | `SCHEDULE_ONLY`… 그대로         | ➕ 매핑 레이어 0 ➖ 서버 enum 변경이 UI까지 전파                                              |
| A5  | coverImage persist 제외         | File은 메모리만, 제출 시 append | ➕ 직렬화 문제 회피 ➖ 새로고침 시 커버만 재선택                                              |
| A6  | PLACE_ONLY는 CRT-03 스킵        | CRT-02(기본정보)→CRT-04 직행    | ➕ 서버 시간필드 미전송과 정합 ➖ 스텝 파생·뒤로가기 분기 처리 필요                           |
| A7  | 제출 Model B                    | host 입력 후 제출 (다음 사이클) | ➕ 서버 필수필드 충족 ➖ 이번 사이클엔 유효 모임 생성 불가(걸어서 도달까지)                   |

### 3-1. 클라이언트 경계 + 가드/resolver/스텝설정 배치

**Context** — draft는 클라이언트 sessionStorage(zustand persist)에 있어 서버 컴포넌트/middleware가 읽을 수
없다. 따라서 가드·resolver·Progress는 클라이언트에서 돌아야 한다. 현재 스캐폴드: 페이지는 서버 placeholder,
middleware 없음, `layout.tsx`가 `<Progress />`(무인자)를 렌더. 어느 안이든 `create-meeting/model`에
`getSteps(type)` · `requiredKeys(step)` · `isStepComplete(step, draft)`를 콜로케이트한 **step-config 모듈**이
공통 부품이다. 차이는 "이걸 누가/어디서 호출해 가드·진행률로 잇느냐"뿐이다.

**Decision — 안2: 페이지별 `use client` + `useStepGuard` 훅.**

- 각 스텝 `page.tsx`를 `'use client'`로 두고, 자기 스텝의 선행 조건을 `useStepGuard(requiredKeys)`로 직접 호출.
- 가드/resolver 로직은 `create-meeting/model`의 훅 **하나**(`useStepGuard`)에 있고, 페이지는 호출만 한다.
- `layout.tsx`는 서버로 유지, `<Progress />`만 draft를 구독하는 작은 클라이언트 컴포넌트로 만든다.
- resolver(`/meetings/new/page.tsx`)도 클라이언트로, draft 완성도를 계산해 `router.replace`.

**Alternatives**

- 안1(layout client wrapper 중앙 가드): 가드 호출 누락은 없지만 layout이 `pathname→step` 매핑을 알아야 해
  결합이 생기고, PLACE_ONLY 같은 분기 예외가 중앙 switch로 몰린다. → 거부.
- 안3(client Provider + context): zustand가 이미 전역 store라 context가 중복 레이어(과설계). CRT-01~06
  규모엔 과함. → 거부.

**Consequences**

- ➕ FSD 정합(페이지=조립, 로직=feature 훅), 스텝 하나가 곧 수직 슬라이스 이슈 하나 → TDD 분해가 자연스럽다.
- ➕ 각 페이지가 `requiredKeys`를 명시해 스텝 의존성이 코드에 드러난다.
- ➖ 새 스텝 추가 시 `useStepGuard` 호출을 빠뜨릴 수 있다 → step-config에 스텝별 requiredKeys를 **단일 소스**로
  두고, 페이지는 키를 재정의하지 않고 참조만 하게 해 누락·불일치를 줄인다.
- ➖ 페이지가 클라이언트 컴포넌트가 된다(위저드 특성상 상호작용 화면이라 수용 가능).

## 4. Out of Scope (이번 사이클)

- 최종 제출(`POST /api/meetings`)과 응답 처리, CRT-07 초대링크.
- host 입력 화면(schedule/dates·times, departure·search) 및 INV 공용 화면.
- 커버사진 앨범 선택 UI / WebView 사진 권한 (crt-05 F01 실동작).
- CRT-04 마감 상한(서버 4320 확장) 실제 반영 — 확장 요청은 별개 트랙.
- 디자인 픽셀 정합·애니메이션(CRT-06 성공 애니메이션 등).
- 각 화면의 세부 UI 인터랙션(각 crt-0X 문서 소관). 이 PRD는 **연결 계층만**.

## 5. 용어 정의

[`spec-fixed.md` §2](./spec-fixed.md) Ubiquitous Language를 그대로 따른다.
핵심: CreateMeetingDraft · planningType · 후보날짜(scheduleCandidateDates) ≠ 방장일정(scheduleResponse) ·
resolver · step guard.
