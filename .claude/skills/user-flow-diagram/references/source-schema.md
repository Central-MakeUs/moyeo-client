<!-- 위치 규칙: 이 문서는 user-flow-diagram 스킬의 참조 규칙이다(디자인 미러).
     구현 뷰(라우트/컴포넌트/상태/API) 스키마가 아니다. -->

# source-schema — 세 스냅샷 스키마

이 문서는 두 개의 독립 snapshot과 하나의 mapping에 사용하는 **필드·타입·enum의 정본**이다.
snapshot을 최종 문서로 반영하는 행동은 [`merge-policy.md`](./merge-policy.md)를 따른다.

## 0. 세 출처의 역할 (정본 경계)

| 스냅샷          | 무엇의 정본인가                        | 절대 담지 않는 것                                      |
| --------------- | -------------------------------------- | ------------------------------------------------------ |
| `figma.yaml`    | **화면 존재·전환(흐름)·노드 타입**     | 기획 식별자, 라우트, 컴포넌트, API, 이미지에 없는 기능 |
| `planning.yaml` | **화면/기능 식별자·설명·`구분`(접근)** | Figma에 없는 노드 위치, 라우트, 컴포넌트, 테스트       |
| `mapping.yaml`  | **두 출처를 연결한 확인된 대응 관계**  | 어느 한쪽에도 없는 정보의 창작                         |

**핵심 규칙:** 한 출처의 정보로 다른 출처의 빈칸을 **추측하지 않는다.** 확신할 수 없으면
`mapping.yaml`에 `status: unresolved`로 남기고 **최종 문서에 병합하지 않는다.**
(status별 반영 게이트의 정본은 [`merge-policy.md`](./merge-policy.md) §4다 — 여기서는 스키마
차원의 원칙만 밝히고 게이트 동작을 다시 정의하지 않는다.)

## 1. 파일 배치

```
docs/design-system/user-flow/sources/
├─ figma.yaml       # (또는 도메인 스코프: figma.crt.yaml)
├─ planning.yaml
└─ mapping.yaml
```

- 전체를 한 파일로 관리하거나, 파일럿·대규모에선 **도메인 스코프 파일**(`*.crt.yaml`)로 쪼갤 수 있다.
  스코프 파일은 상단 `scope:` 로 담는 범위를 명시한다(예: `scope: CRT`).
- `sources/` 는 **커밋되는 산출물**이다(개인용 `.local-docs` 아님). 최종 문서의 provenance이기 때문.

## 2. `figma.yaml` — 흐름 스냅샷

```yaml
scope: CRT # (선택) 이 파일이 담는 도메인
source:
  url: https://www.figma.com/design/…?node-id=1411-13117 # &t= 세션토큰 제거
  node_id: 1411-13117
  synced_at: 2026-07-18 # 이 스냅샷을 Figma에서 뜬 날 (YYYY-MM-DD)

nodes:
  - id: crt # 짧은 영문 id (mermaid 노드 id로 그대로 사용)
    label: 모임 생성 (CRT) # 시안의 화면/동작 텍스트 그대로 (Ubiquitous Language)
    type: main # 6종 중 하나 ↓
    column: create # (선택) 시안의 세로 컬럼 그룹 — 레이아웃용

edges:
  - from: crt
    to: info
  - from: type1
    to: sched
    label: 일정만 / 둘 다 # 분기 엣지 조건 라벨 (시안 표기 그대로)
```

- **`type` 6종**(값 그대로): `terminal · main · detail · conditional · feature · branch`.
  의미·색은 [`render-conventions.md`](./render-conventions.md) 참조.
- 여기 담지 않는 것: `ONB-01-F04` 같은 기획 식별자 추측, 라우트/컴포넌트/API, 시안에 없는 세부 기능.
  **Figma에서 눈으로 확인되는 사실만.**

## 3. `planning.yaml` — 기획 스냅샷

```yaml
source:
  document: docs/features/CRT-02/ (F01 prd/spec/issues) # 근거 문서 경로
  synced_at: 2026-07-20

screens:
  - id: CRT-01 # 기획자 소유 식별자 — 절대 수정/재번호 금지
    name: 모임 생성 - 기본 정보
    access: 미확인 # 구분(회원/비회원/게스트) — 없으면 '미확인' (임의로 채우지 않음)
    owner: planning
    features: # 이 화면의 F 기능. 없으면 [] + 아래 note
      []
    note: 이 화면의 F 인벤토리는 기획 문서 미확보(스크린샷만 존재)

  - id: CRT-02
    name: 모임 생성 - 일정 정하기
    access: 미확인
    owner: planning
    features:
      - id: CRT-02-F01 # {DOMAIN}-{SCREEN}-F{NN}
        name: Draggable Calendar
        description: 조율 후보 날짜를 드래그(페인트)·탭으로 선택 → scheduleCandidateDates
        owner: planning
        refs: [docs/features/CRT-02/F01/prd.md] # (선택) 상세 근거
```

### 식별자 규칙 (기획자 확인 완료 — 재조사 불필요)

- `{DOMAIN}`(ONB/ACC/CRT/INV/VIEW) · `{DOMAIN}-{SCREEN}`(CRT-01) · `{DOMAIN}-{SCREEN}-F{NN}`(CRT-02-F01).
  `F` = Feature.
- **화면번호는 굵은 단위다.** 기획 화면 1개 ↔ Figma 노드 N개 매핑이 정상. 프론트가 하위 세분화 가능하나
  **임의로 하지 말고 후보안을 사용자 승인**으로 확정한다.
- **`F{NN}`은 화면별로 `F01`부터 다시 시작한다.** 화면 식별자가 바뀌면 번호를 리셋한다.
  예: `ONB-01-F01` 이후 `ACC-01`의 첫 기능은 `ACC-01-F01`이다. 기획자 소유 식별자는 이 규칙을
  따르더라도 스킬이 임의 생성하지 않고, 기획에서 확정된 값만 기록한다.
- **owner 분리**: 기획자 소유 ID(`CRT-02`, `CRT-02-F01`)는 수정·재번호 금지. 프론트 세분화 식별자는
  숫자 연장(`CRT-01-03`) **금지**, 이름 기반(`CRT/step-place`, `CRT-01/step-cover`)만. 모든 항목에 `owner`.
- **`access`(구분)는 기획 화면목록 표에 있을 때만 채운다.** 흐름 위치로 추론(예: HOME 이후니 회원)한 값은
  `access`에 넣지 말고 `mapping.yaml`에 `status: inferred`로 별도 기록한다.

## 4. `mapping.yaml` — 연결 스냅샷

```yaml
mappings:
  # 화면 매핑 (1:N 지원 — 하나의 기획 화면 ↔ 여러 Figma 노드)
  - planning_screen: CRT-01
    figma_nodes: [info, name, count] # 기본정보 화면에 묶이는 Figma 노드들
    status: confirmed # confirmed | inferred | unresolved

  # 기능 매핑 (전환을 일으키는 기능은 최종 문서 edge 라벨로 병기)
  - planning_feature: CRT-02-F01
    figma_node: schedIn # 조율 날짜/시간대 입력
    status: confirmed

  # 미해결 — 대응 식별자를 못 찾음 (창작 금지)
  - figma_nodes: [mid, hostStart, hostMove]
    planning_screen: null
    status: unresolved
    reason: 기획에 '장소' 화면 식별자 미확보(CRT-03 등 문서 없음)
    proposed_frontend_id: CRT/step-place # (선택) 프론트 세분화 후보안 — 사용자 승인 전엔 미채택

  # 필드 단위 미해결 (예: 구분)
  - target: CRT-01.access
    status: inferred
    reason: 흐름상 HOME(로그인 필요) 이후 진입 → 회원 추정. 기획 화면목록 표로 확정 필요.
```

- **`status` enum**: `confirmed`(두 출처가 명확히 일치) · `inferred`(추론했으나 미확정) ·
  `unresolved`(대응 없음/충돌).
- `inferred`와 `unresolved`에는 판단 근거를 `reason`으로 기록한다.
- status별 최종 반영 행동은 [`merge-policy.md`](./merge-policy.md)를 따른다.
