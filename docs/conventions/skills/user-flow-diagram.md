# User Flow Diagram 스킬 사용법

`user-flow-diagram`은 Figma의 화면 흐름과 기획 문서의 화면·기능 식별자를 각각 보존한 뒤,
명시적인 매핑을 통해 Mermaid 유저 플로우 문서를 만드는 Claude 스킬이다.

> 이 문서는 **팀원용 빠른 시작 가이드**다. Claude가 따르는 실행 규칙은
> [SKILL.md](../../../.claude/skills/user-flow-diagram/SKILL.md), 상세 스키마와 정책은
> [references](../../../.claude/skills/user-flow-diagram/references/)를 기준으로 한다.

## 언제 사용하는가

- Figma User Flow를 Mermaid 문서로 옮길 때
- 기획 문서의 화면·기능 식별자와 `구분`을 정리할 때
- Figma 또는 기획이 바뀌어 기존 유저 플로우 문서를 갱신할 때
- Figma 흐름과 기획 식별자를 연결한 최종 문서가 필요할 때

라우트, 컴포넌트, 상태, API, 인증 정책을 설계하는 용도로는 사용하지 않는다. 이 스킬은
**디자인 미러(UX 뷰)**만 다룬다.

## 입력과 출력 한눈에 보기

| 모드         | 준비할 입력                               | 중간 산출물                                          | 최종 산출물                           |
| ------------ | ----------------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `figma`      | node-id가 포함된 Figma 링크와 이미지·시안 | `sources/figma.yaml` 또는 `figma.{scope}.yaml`       | snapshot까지만                        |
| `planning`   | 기획 문서 경로 또는 화면·기능 목록        | `sources/planning.yaml` 또는 `planning.{scope}.yaml` | snapshot까지만                        |
| `merge`      | Figma·기획 스냅샷과 명시적 mapping        | 검증·갱신된 `mapping*.yaml`                          | Mermaid + 화면별 기능표 + 미해결 목록 |
| quick render | 그림으로 옮길 화면 흐름                   | 없음                                                 | 커밋하지 않는 임시 Mermaid            |

기본 산출 경로는 다음과 같다.

```text
docs/design-system/
└─ user-flow/
   ├─ README.md
   ├─ account.md
   ├─ create.md
   ├─ invite.md
   ├─ view.md
   └─ sources/
      ├─ figma.crt.yaml
      ├─ planning.crt.yaml
      └─ mapping.crt.yaml
```

서브플로우가 3개 미만이면 `docs/design-system/user-flow.md` 단일 파일로 시작할 수 있다.
3개 이상이면 현재 구조처럼 `user-flow/` 폴더로 나눈다.

최종 Markdown은 Figma와 기획을 병합한 SoT이며 `merge` 모드에서만 생성·수정한다. `figma`와
`planning` 모드는 `sources/`의 snapshot만 갱신한다.

## 시작 전 준비

### Figma 작업

- 정확한 User Flow 프레임을 가리키는 `node-id` 포함 링크
- Claude가 화면과 연결선을 읽을 수 있는 이미지 또는 Figma 시안
- 동기화 날짜(`YYYY-MM-DD`)
- 링크에 붙은 개인 세션 토큰 `&t=...`을 제거할 준비

### 기획 작업

- 화면 목록 또는 기능 명세 문서 경로
- 기획자가 정한 화면·기능 식별자
- 문서에 존재하는 `구분` 값(회원·비회원·게스트 등)
- 기획 문서를 확인한 날짜

`F{NN}`은 화면별로 `F01`부터 다시 시작한다. 예를 들어 `ONB-01`에서 `ACC-01`로 화면 식별자가
바뀌면 첫 기능 번호도 `ACC-01-F01`로 리셋된다. 다만 스킬이 새 식별자를 임의로 만들지는 않는다.

값이 없거나 확실하지 않으면 미리 채우지 않는다. `미확인`, `inferred`, `unresolved`로 남기는 것이
정상 동작이다.

## 어떤 모드를 선택하는가

```text
Figma만 새로 받음 ───────────────→ figma
기획 문서만 새로 받음 ───────────→ planning
한쪽이 바뀌어 최종 문서도 갱신 ─→ 해당 스냅샷 갱신 후 merge
회의 중 그림만 빠르게 필요 ─────→ quick render
```

`merge`는 Figma와 기획을 한 번에 새로 해석하는 명령이 아니다. 변경된 출처의 스냅샷만 갱신하고,
기존 mapping을 다시 검증한 뒤 `confirmed` 항목만 최종 본문에 반영한다.

## 권장 커밋 순서

출처별 변경과 파생 결과를 분리하면 어떤 데이터가 언제 바뀌었는지 리뷰하기 쉽다.

1. **스킬** — `.claude/skills/user-flow-diagram/`과 팀원용 사용법
2. **Figma snapshot** — `figma*.yaml`과 근거 이미지
3. **Planning snapshot** — `planning*.yaml`
4. **Merge 결과** — `mapping*.yaml`과 최종 `README.md`·서브플로우 Markdown

앞 단계의 커밋이 준비되기 전에는 다음 단계의 파일을 함께 커밋하지 않는다.

## 요청 예시

Claude에게 스킬 이름, 모드, 입력, 원하는 범위를 함께 알려주면 가장 빠르게 시작할 수 있다.

### Figma 스냅샷 생성·갱신

```text
user-flow-diagram의 figma 모드로 CRT 범위를 갱신해줘.
Figma 링크: <node-id가 포함된 링크>
첨부한 User Flow 이미지를 기준으로 하고, 기획 식별자는 추측하지 마.
```

### 기획 스냅샷 생성·갱신

```text
user-flow-diagram의 planning 모드로 CRT 범위를 갱신해줘.
입력 문서는 docs/fe-implement-spec/05-crt-01.md부터 10-crt-06.md까지야.
문서에 없는 구분이나 F 식별자는 만들지 마.
```

### 최종 문서 병합

```text
user-flow-diagram의 merge 모드로 CRT 유저 플로우를 다시 생성해줘.
figma.crt.yaml과 planning.crt.yaml 중 변경된 쪽만 갱신하고,
mapping.crt.yaml에서 confirmed인 항목만 최종 본문에 반영해줘.
```

### 임시 Mermaid

```text
user-flow-diagram의 quick render로 이 화면 목록을 Mermaid 흐름도로 보여줘.
문서나 sources 파일은 수정하지 마.
```

## 실행 중 팀원이 확인할 결정

Claude가 다음 항목을 물으면 자동으로 정하지 말고 출처를 확인한다.

- Figma 노드와 기획 화면이 실제로 같은 화면인지
- 하나의 기획 화면에 여러 Figma 노드를 연결해도 되는지
- Figma에만 있는 화면에 프론트 식별자 후보가 필요한지
- 충돌한 이름·식별자 중 어느 출처가 최신인지
- 기획에 없는 `구분`이나 기능 식별자가 정말 새로 확정된 것인지

프론트 세분화 식별자는 숫자를 연장하지 않고 `CRT/step-place`처럼 이름 기반 후보로 제안한다.
사용자 승인 전에는 확정 식별자로 반영하지 않는다.

## 생성 후 확인

- [ ] Figma에는 화면·전환·노드 타입만 들어갔는가?
- [ ] planning에는 문서에 실제로 있는 식별자·설명·`구분`만 들어갔는가?
- [ ] mapping의 불확실한 대응이 `inferred` 또는 `unresolved`로 남았는가?
- [ ] 최종 Mermaid와 기능표에는 `confirmed`만 반영됐는가?
- [ ] 화면 전환이 없는 기능도 기능표에서 사라지지 않았는가?
- [ ] Figma·기획·병합 날짜가 각각 기록됐는가?
- [ ] Figma URL에서 개인 세션 토큰 `&t=...`을 제거했는가?
- [ ] Mermaid가 GitHub의 밝은 배경에서 읽히는가?
- [ ] 라우트·컴포넌트·API 같은 구현 정보가 섞이지 않았는가?

## 자주 혼동하는 점

### 최종 Markdown을 직접 고쳐도 되는가?

최종 Markdown은 세 스냅샷에서 만들어지는 파생 문서다. 출처가 바뀌었다면 해당 YAML과 mapping을
먼저 갱신한 뒤 다시 병합한다.

### 기획에 없는 화면을 Figma에서 발견하면 어떻게 하는가?

기획 식별자를 새로 만들지 않는다. mapping에 `unresolved`와 이유를 남기고, 필요하면 이름 기반
프론트 식별자를 `proposed_frontend_id`로 제안한다.

### 기획에는 있지만 Figma에서 전환이 없는 기능은 삭제하는가?

삭제하지 않는다. Mermaid 노드로 그리지 않더라도 화면별 기능표에 보존한다.

### Figma만 빠르게 그려도 되는가?

가능하다. 커밋하지 않을 그림은 quick render를 사용한다. `figma` 모드는 snapshot만 갱신하며,
quick render 결과는 최종 문서로 커밋하지 않는다.

## 상세 규칙

- [입력 YAML 스키마와 정본 경계](../../../.claude/skills/user-flow-diagram/references/source-schema.md)
- [Mermaid 노드·색상·레이아웃 규칙](../../../.claude/skills/user-flow-diagram/references/render-conventions.md)
- [병합과 status 게이트](../../../.claude/skills/user-flow-diagram/references/merge-policy.md)
