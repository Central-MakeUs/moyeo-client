# 2. 모임 생성 (CRT)

모임 홈의 "모임 생성 FAB"에서 진입. **선형 위저드**로 기본 정보 → 유형 선택 → 시간 범위·마감 →
커버사진 → 링크 생성/공유 순으로 진행한다. 커버사진 등록 단계에서 **모임 참여(INV)로 이어지는 분기**가
있다(공유된 링크로 참여자가 진입 — [invite.md](./invite.md) 참고). 일정/위치 조율 분기는 생성이 아니라
참여(INV) 단계에 있다. 개요·범례는 [README](./README.md) 참고.

> **⚠ 반영 대기 — 역할/접근** (Figma 수정 요청됨): `모임 생성(CRT)`은 **회원 전용**이다. 커버사진 등록으로
> 모임이 생성되면 모임장도 참여자와 같은 입력 흐름(INV)에 합류하고, `링크 생성/공유`는 **모임장 전용**
> 페이지다. 이후 `이동수단 입력 → {모임장?}` 역할 게이트는 [invite.md](./invite.md)의 ⚠ 노트 참고.

```mermaid
%%{init: {'theme':'base','themeVariables':{'background':'#f7f7f7','fontFamily':'SUIT, Pretendard, sans-serif','textColor':'#171717','lineColor':'#FB6666','edgeLabelBackground':'#ffffff'}, 'flowchart':{'curve':'linear'}, 'themeCSS':'.edgeLabel,.edgeLabel p{color:#171717!important;opacity:1!important;}'}}%%
%% ── 출처/신선도 (Source & Freshness) ──
%% 정본(Source of Truth): Figma User Flow — https://www.figma.com/design/2aUk6ATnyVjjBTlhHRwsbT/CMC-19th--%EB%AA%A8%EC%97%AC-MOYEO-?node-id=2564-16578
%% 기준 프레임(node): 2564-16578
%% 마지막 동기화: 2026-07-21
%% 생성 스킬: user-flow-diagram · 규칙 기준일 2026-07-21
%% ⚠ 정본은 Figma이며 이 mermaid는 위 시점의 참고본이다. 최신은 항상 Figma를 확인할 것.
flowchart TD
  crt(모임 생성 - CRT):::main
  info(기본 정보 입력):::detail
  name(모임 이름 입력):::feature
  count(모임 인원 입력):::feature
  type(모임 유형 선택):::detail
  range(시간 범위 설정):::detail
  deadline(마감 시간 설정):::detail
  cover(커버사진 등록):::detail
  link(링크 생성 / 공유):::detail
  crtDone([모임 생성 완료]):::terminal
  toInv([모임 참여 - INV 로 이어짐]):::terminal

  crt --> info --> name --> count --> type
  type --> range --> deadline --> cover
  cover --> link --> crtDone
  cover --> toInv

  classDef terminal    fill:#ffffff,stroke:#FFBBB7,stroke-width:1px,color:#171717;
  classDef main        fill:#FB6666,stroke:#FB6666,stroke-width:1px,color:#ffffff;
  classDef detail      fill:#FFBBB7,stroke:#FFBBB7,stroke-width:1px,color:#171717;
  classDef conditional fill:#FFBBB799,stroke:#FB6666,stroke-width:1.5px,stroke-dasharray:5 3,color:#171717;
  classDef feature     fill:#FFE6E4,stroke:#FFE6E4,stroke-width:1px,color:#171717;
  classDef branch      fill:#ffffff,stroke:#FB6666,stroke-width:1.5px,color:#171717;
```
