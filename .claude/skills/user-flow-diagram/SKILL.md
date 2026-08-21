---
name: user-flow-diagram
description: >
  moyeo의 유저 플로우(User Flow) / 화면 흐름도 문서를 만들고 유지하는 스킬. 두 출처를 다룬다 —
  Figma User Flow 시안(화면·전환의 정본)과 기획 문서(화면·기능 식별자 `CRT-02-F01`·`구분`의 정본).
  이 둘을 독립 스냅샷으로 뜬 뒤 명시적 매핑으로 병합해, 아래 스킬들이 인용하는 상위 SoT 문서를 낸다.

  세 실행 모드로 동작한다.
  * figma 모드 — Figma 시안에서 화면·전환·노드 타입을 추출해 `figma*.yaml` snapshot을 생성·갱신한다.
    최종 Markdown은 수정하지 않는다.
  * planning 모드 — 기획 문서에서 화면·기능 식별자·설명·구분을 추출해 `planning*.yaml` snapshot을
    생성·갱신한다. 최종 Markdown은 수정하지 않는다.
  * merge 모드 — 두 snapshot의 명시적 대응을 `mapping*.yaml`에 기록하고, confirmed 항목으로
    최종 문서(mermaid + 기능표)를 재생성한다.

  사용자가 다음과 같은 요청을 하면 반드시 사용한다.
  * "유저 플로우 그려줘" / "화면 흐름도 만들어줘" / "user flow 다이어그램" / "플로우차트로 그려줘"
  * "온보딩/회원가입/모임생성 플로우 도식화해줘" / "화면 목록(또는 기획)을 흐름도로 바꿔줘"
  * "기획 화면·기능 식별자 정리해줘" / "F 식별자 붙여줘" / "figma랑 기획 합쳐서 플로우 문서 만들어줘"
  * "Figma(또는 기획) 바뀌었으니 유저 플로우 문서 갱신해줘" / docs 에 넣을 mermaid flowchart 요청

  사용자가 "mermaid"·스킬 이름·모드를 직접 말하지 않아도, moyeo의 화면 전환·유저 여정·화면/기능
  식별자를 도식화·정리하는 맥락이 감지되면 적극적으로 사용한다. 임의의 색·도형·식별자를 만들지 말고
  항상 references의 프리셋·스키마·병합 규칙을 적용한다.

  이 스킬은 디자인 미러(SoT=Figma+기획)다. 라우트/컴포넌트/상태/API 같은 "구현 뷰" 요소는 범위 밖이다.
---

# moyeo User Flow 스킬

입력을 보고 실행 모드를 선택하고 해당 reference를 읽는다. 세부 스키마·렌더링·병합 규칙을 이 파일에
중복해서 정의하지 않는다.

## Reference 라우팅

| Reference                                                                | 유일한 책임                                     | 언제 읽나            |
| ------------------------------------------------------------------------ | ----------------------------------------------- | -------------------- |
| [`references/source-schema.md`](./references/source-schema.md)           | `figma`·`planning`·`mapping` YAML의 필드와 enum | 모든 snapshot 작업   |
| [`references/render-conventions.md`](./references/render-conventions.md) | Mermaid 표현·레이아웃·출력 위치                 | quick render와 merge |
| [`references/merge-policy.md`](./references/merge-policy.md)             | 병합 행동·status 게이트·최종 SoT 생성           | merge                |

## 모드 선택

| 입력 상황                                 | 모드         | 다음 행동                                     |
| ----------------------------------------- | ------------ | --------------------------------------------- |
| Figma 이미지/시안만                       | `figma`      | source-schema를 읽고 `figma*.yaml`만 갱신     |
| 기획 문서/화면 목록만                     | `planning`   | source-schema를 읽고 `planning*.yaml`만 갱신  |
| 두 snapshot을 연결하거나 최종 문서를 생성 | `merge`      | 세 reference를 읽고 mapping과 최종 문서 갱신  |
| 커밋하지 않을 임시 그림만 필요            | quick render | render-conventions만 읽고 대화에 Mermaid 제공 |

모드가 모호하면 사용자에게 묻는다. `figma`와 `planning` 모드에서는 최종 Markdown을 생성하거나
수정하지 않는다. 최종 SoT는 `merge` 모드에서만 만든다.

## 공통 경계

- 출처에 없는 식별자·값·흐름을 추측하지 않는다.
- 라우트·컴포넌트·상태·API·테스트·인증 판단을 추가하지 않는다.
- 기획자 소유 식별자를 수정하거나 임의 생성하지 않는다.
- snapshot과 최종 문서는 커밋하되 quick render 결과는 커밋하지 않는다.

## 마무리 체크리스트

규칙의 정본은 각 reference다. 아래는 그 규칙을 **다시 정의하지 않고 확인만** 하는 점검표다
(괄호는 근거 정본 위치).

- [ ] 입력에 맞는 모드를 골랐다 — 모호하면 사용자에게 물었다.
- [ ] 정본 경계를 지켰다 — figma=화면·흐름, planning=식별자·설명·`구분`, 혼입 없음 (source-schema §0).
- [ ] 출처에 없는 값을 추측하지 않았다 — `구분`·F 식별자·매핑을 창작하지 않음 (source-schema §0 · merge-policy §1).
- [ ] `figma`/`planning`에서 최종 Markdown을 만들거나 고치지 않았다 — 최종 SoT는 merge 전용.
- [ ] (merge) 본문엔 `confirmed`만, `inferred`/`unresolved`는 미해결 섹션에 이유와 함께 (merge-policy §4).
- [ ] (merge) 최종 문서가 2층이고 모든 F·`구분`이 보존됐다 (merge-policy §5 · §6).
- [ ] 신선도 헤더를 넣었다 — 단일출처=render-conventions §5, merge=출처별 날짜 (merge-policy §7).
