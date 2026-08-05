# HOME-01

> [!WARNING]
> 이 문서는 최신 HOME 기획 및 `create/README.md` 규격이 아직 반영되지 않은 검토 전 문서입니다.
> 현재 개발 범위에서는 `HOME-01-F06 모임 생성 FAB`과 `CRT-01 모임 유형 Drawer` 진입 흐름만
> 구현 근거로 사용합니다. 나머지 기능과 화면 이동은 구현 전에 최신 기획을 다시 확인해야 합니다.

## 1. 화면 개요

| 항목      | 내용                                                             |
| --------- | ---------------------------------------------------------------- |
| Domain    | HOME                                                             |
| 화면 ID   | HOME-01                                                          |
| 화면명    | 모임 홈                                                          |
| Owner     | planning                                                         |
| 관련 화면 | VIEW-01, CRT-01(모임 유형 Drawer), CRT-02, HOME-01-A(마이페이지) |

### 목적

사용자가 참여 중인 모임과 확정된 모임을 확인하고,

- 모임 생성
- 모임 상세 확인
- 마이페이지 이동

을 수행하는 메인 화면이다.

---

# 2. 기획 식별자

| ID          | Owner    | 기능              | 설명                       |
| ----------- | -------- | ----------------- | -------------------------- |
| HOME-01     | planning | 모임 홈           | 메인 홈 화면               |
| HOME-01-F01 | planning | 모임 탭 구분      | 진행 중 / 확정된 모임 구분 |
| HOME-01-F02 | planning | 진행 중 모임 카드 | 진행 중 모임 리스트        |
| HOME-01-F03 | planning | 확정된 모임 카드  | 확정된 모임 리스트         |
| HOME-01-F04 | planning | 확정된 모임 모달  | 확정된 모임 상세           |
| HOME-01-F05 | planning | 확정된 모임 공유  | 모달 내 공유               |
| HOME-01-F06 | planning | 모임 생성 FAB     | 모임 생성 시작             |
| HOME-01-F07 | planning | Empty State       | 모임이 없는 상태           |
| HOME-01-F08 | planning | 프로필 버튼       | 마이페이지 이동            |

---

# 3. 화면 흐름

```text
HOME(Default)

├── 진행 중 모임 조회

├── 확정된 모임 조회

├── 진행 중 카드 선택
│      ↓
│    VIEW-01

├── 확정된 카드 선택
│      ↓
│   확정 모임 모달

├── FAB 선택
│      ↓
│    CRT-01 (모임 유형 Drawer)
│      ↓
│    CRT-02 (/meetings/new/basic)

└── 프로필 선택
       ↓
 HOME-01-A
```

---

# 4. Wireframe 분석

## Default

확인 가능한 요소

- 상단 제목
- 프로필 버튼
- 진행 중 모임 영역
- 확정된 모임 영역
- FAB

리스트는 스크롤 가능

---

## Empty State

확인 가능한 요소

- 진행 중 Empty
- 확정된 Empty
- FAB 유지

문구

> 아직 모임이 없어요

---

## FAB Open

FAB 선택 시

3개의 빠른 액션 표시

확인 가능한 항목

- 일정 정하기
- 둘 다 정하기
- 장소 정하기

### 확정 (2026-07-27)

이 FAB 메뉴가 곧 **CRT-01 모임 유형 선택 Drawer**다. 3개 항목은 별개의 CRT 화면으로 가는 링크가 아니라
**하나의 값(`planningType`)을 고르는 선택지**이며, 아래 하단 `선택` 버튼을 눌러야 다음 화면으로 넘어간다.

| 항목         | `planningType`       | 이후 흐름                           |
| ------------ | -------------------- | ----------------------------------- |
| 일정 정하기  | `SCHEDULE_ONLY`      | CRT-02 → CRT-03(시간 범위) → CRT-04 |
| 장소 정하기  | `PLACE_ONLY`         | CRT-02 → CRT-04(시간 범위 건너뜀)   |
| 둘 다 정하기 | `SCHEDULE_AND_PLACE` | CRT-02 → CRT-03 → CRT-04            |

- 어느 항목을 골라도 **다음 화면은 CRT-02(모임 생성 - 기본 정보, `/meetings/new/basic`)로 동일**하다.
  선택값은 그 이후 스텝 구성(시간 범위 유무, 방장 입력 종류)을 결정한다.
- 상세 명세: [`crt-01.md`](../create/crt-01/crt-01.md)

---

## 확정 모임 모달

확인 가능한 요소

- 커버 이미지
- 모임명
- 설명
- 참가자 목록
- 닫기 버튼

기획에는

추가로

- 확정 일시
- 확정 장소

표시라고 되어 있음.

Wireframe에서는 생략되어 있음.

---

# 5. 기획 ↔ Wireframe 비교

| 기능         | 기획 | Wireframe | 결과             |
| ------------ | ---- | --------- | ---------------- |
| 진행 중 카드 | ✅   | ✅        | 일치             |
| 확정 카드    | ✅   | ✅        | 일치             |
| FAB          | ✅   | ✅        | 일치             |
| Empty        | ✅   | ✅        | 일치             |
| 프로필       | ✅   | ✅        | 일치             |
| 공유 버튼    | ✅   | ❌        | Wireframe 미표현 |
| 확정 일시    | ✅   | ❌        | Wireframe 미표현 |
| 확정 장소    | ✅   | ❌        | Wireframe 미표현 |

---

# 6. UI States

## Default

- 진행 중 모임 존재
- 확정된 모임 존재

---

## Empty

- 진행 중 모임 없음
- 확정된 모임 없음

---

## FAB Expanded

FAB 메뉴 노출

---

## Confirmed Modal

확정 모임 상세 표시

---

# 7. Frontend 후보

> owner: frontend

| ID                       | 상태      | 설명           |
| ------------------------ | --------- | -------------- |
| HOME-01/default          | candidate | 기본 홈        |
| HOME-01/empty            | candidate | Empty UI       |
| HOME-01/fab-menu         | candidate | FAB 메뉴       |
| HOME-01/confirmed-modal  | candidate | 확정 모달      |
| HOME-01/in-progress-list | candidate | 진행 중 리스트 |
| HOME-01/completed-list   | candidate | 확정 리스트    |

---

# 8. Route 후보

> 후보안

```text
/

↓

HOME

↓

VIEW-01

↓

CRT-02 (/meetings/new/basic)
  ※ CRT-01은 Drawer라 라우트 없음

↓

HOME-01-A
```

※ HOME 자체는 별도 하위 Route 없이 상태(State)로 관리할 가능성이 높음.

---

# 9. Component 후보

## Layout

- HomeHeader
- HomeSection

---

## Card

- InProgressMeetingCard
- ConfirmedMeetingCard

---

## FAB

- CreateMeetingFab
- CreateMeetingFabMenu

---

## Modal

- ConfirmedMeetingModal

---

## Common

- EmptyState
- ProfileButton

---

# 10. API 영향

## 조회

예상

```text
GET /meetings
```

또는

```text
GET /meetings?status=in-progress

GET /meetings?status=confirmed
```

### 미확인

API 명세 필요

---

## 이동

HOME → VIEW

선택된 meeting id 전달 필요

---

## 공유

### 미확인

공유 방식 미정

---

# 11. 상태(State)

## Loading

- 홈 최초 조회
- FAB Action

---

## Success

- 리스트 조회 완료

---

## Empty

- 진행 중 없음
- 확정 없음

---

## Error

- 조회 실패

---

## Modal

- Open
- Close

---

# 12. Edge Case

- 진행 중만 존재
- 확정만 존재
- 둘 다 없음
- 카드 1개
- 카드 다수(스크롤)
- 마감 시간이 방금 변경됨
- 확정 모임 삭제
- FAB 연속 클릭
- 모달 열린 상태에서 뒤로가기
- 공유 실패
- 네트워크 오류

---

# 13. QA

### 리스트

- 진행 중/확정 분리 표시
- 스크롤 정상 동작
- Empty 표시

### 카드

- 진행 중 카드 → VIEW 이동
- 확정 카드 → 모달 표시

### FAB

- 메뉴 정상 노출
- 각 Action 이동 확인

### 모달

- 닫기
- 뒤로가기
- 공유

### 프로필

- HOME-01-A 이동

### 시간 표시

- 24시간 이상
- 24시간 이하
- 1시간 이하

기획 명세에 맞게 표시되는지 확인

---

# 14. unresolved

### ~~1. FAB 메뉴의 목적~~ → 해소 (2026-07-27)

Wireframe의

- 일정 정하기
- 둘 다 정하기
- 장소 정하기

는 **각각 다른 CRT 화면으로 가는 링크가 아니다.** 이 메뉴 자체가 **CRT-01 모임 유형 선택 Drawer**이고,
세 항목은 `planningType` 한 값을 고르는 선택지다. 하단 `선택` 버튼을 누르면 **어느 항목이든 CRT-02
(`/meetings/new/basic`)로 이동**하며, 고른 값이 이후 스텝 구성을 결정한다.

→ 상세는 [FAB Open](#fab-open) 절과 [`crt-01.md`](../create/crt-01/crt-01.md).

---

### 2. HOME-01-F05(공유)

기획에는 공유 버튼이 존재하지만 Wireframe에서는 표현되어 있지 않다.

→ **Wireframe 업데이트 또는 기획 확인 필요**

---

### 3. 확정 모달 정보

기획에는

- 확정 일시
- 확정 장소

표시가 명시되어 있으나 Wireframe에서는 생략되어 있다.

→ **최신 Wireframe 확인 필요**

---

### 4. 진행 중 / 확정된 모임 표시 방식

기획에서는 "탭 구분"이라는 용어를 사용하지만, Wireframe은 탭이 아닌 **하나의 스크롤 화면 안에서 두 섹션을 연속으로 배치**하고 있다.

→ **'탭'이 실제 탭 UI를 의미하는지, 단순 섹션 구분을 의미하는지 기획 확인 필요**.
