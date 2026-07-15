---
name: pr-writer-gh-template
description: 현재 git 브랜치의 이슈 번호와 커밋들을 근거로 PR 본문을 작성하되, 구조를 레포의 .github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md(GitHub PR 템플릿)에서 그대로 가져와 채우는 스킬. 초안을 [GATE]로 검토받은 뒤, gh CLI로 바로 PR을 올릴지 로컬 파일(.local-docs/pr/)로만 저장할지 사용자가 선택하게 한다. pr-writer의 변형안 — 구조를 스킬 안에 내장하지 않고 .github 템플릿을 단일 기준(single source of truth)으로 삼는다는 점이 다르다. 팀이 어느 방식을 채택할지 논의 중이므로, 사용자가 "gh 템플릿으로 PR 써줘", "PR 템플릿 채워줘", "pr-writer-gh-template"처럼 이 변형을 명시할 때 사용한다. (구조 내장형은 pr-writer)
---

# PR Writer (GitHub 템플릿 기반 변형안)

`pr-writer`와 목적·흐름은 같다. **단 하나의 차이**: PR 구조를 스킬에 내장하지 않고
레포의 `.github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md`를 **읽어서 각 섹션을 채운다.** 이렇게 하면
레포에 커밋된 템플릿 파일과 이 스킬의 산출물이 **항상 같은 구조**가 된다
(구조가 한 곳에서만 관리됨).

```
현재 브랜치 + 커밋 이력 + (연결된 이슈)
    ↓ 1단계 — 컨텍스트 수집 (이슈번호·커밋·diff)
    ↓ 2단계 — .github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md 를 읽어 각 섹션 채우기
    ↓ [GATE] 초안 검토·승인
    ↓ 3단계 — 처리 방식 선택 (gh 바로 올리기 / 로컬 저장)
gh PR URL  또는  .local-docs/pr/pr-#N.md
```

**이 스킬이 하지 않는 것**: 커밋 생성·수정, 코드 변경, 승인 없는 브랜치 push,
완료되지 않은 작업을 완료로 서술. PR **본문 작성과 등록**까지만 책임진다.

> `pr-writer`(구조 내장형)와 이 변형안 중 무엇을 팀 표준으로 삼을지는 논의 중이다.
> 두 스킬이 같은 트리거 문구에 함께 반응할 수 있으니, 이 변형을 쓰려면 명시적으로 부른다.

---

## 1단계: 컨텍스트 수집

`pr-writer`와 동일하다. 추측하지 말고 git에서 사실을 읽는다.

### 이슈 번호 추출

```bash
git branch --show-current
```

브랜치 네이밍 `type/#이슈번호/설명`(예: `feat/#31/customize-calendar`, `chore/#32/naming`)에서
`type/` 뒤의 **첫 `#?숫자` 그룹**이 이슈 번호다(`#` 유무 무관). 못 찾으면 **멈추고 사용자에게 묻는다** — 지어내지 않는다.

### 베이스 브랜치와 커밋 범위

moyeo 머지 흐름은 `feat/*` → **`develop`**. 베이스 기본값 `develop`.

```bash
git log --oneline develop..HEAD      # 이 브랜치가 develop에서 갈라진 뒤의 커밋들
git diff --stat develop...HEAD
```

- `develop`이 로컬에 없으면 `origin/develop` → `main` 순으로 폴백하고 사용자에게 알린다.
- 커밋 메시지(Conventional Commits)·diff로 **무엇이/왜** 바뀌었는지 파악한다. `docs:`·`chore:` 부수 커밋과 기능 커밋을 구분한다.

### 연결 문서·이슈 (있으면)

- `gh issue view N`으로 이슈 본문·완료 조건(AC)·의존성을 읽는다(가능할 때).
- `docs/features/**/issue-*.md`·`issues.md`가 있으면 AC·의존성·작업 범위의 근거로 삼는다.
- **커밋(실제 한 일)이 문서보다 우선.** 문서에만 있고 커밋엔 없는 범위는 "기타·후속"으로 분리한다.

---

## 2단계: 템플릿을 읽어 채우기

### 2-1. 템플릿 로드

```bash
cat .github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md
```

- 이 파일이 **구조의 단일 기준**이다. 섹션(헤딩)·표·체크리스트를 그대로 유지한 채 내용만 채운다.
- 파일이 없으면(레포에 아직 없음) 사용자에게 알리고, `pr-writer`(구조 내장형)로 전환할지 묻는다.
  이 변형은 템플릿 파일이 있을 때를 전제한다.

### 2-2. 섹션 채우기 규칙

- **작성 가이드 주석(`<!-- -->`)은 지침**이다. 그 지침대로 채우고, 최종 본문에서 주석은 **지운다**
  (GitHub은 주석을 렌더링하지 않지만, 스킬 산출물에는 깔끔히 제거해 남긴다).
- **체크박스는 근거대로**: 커밋·검증으로 확인된 것만 `[x]`. 미완(PR 머지 등)은 `[ ]`.
  안 돌려본 명령을 "통과"로 적지 않는다.
- **의존성 섹션**: 브랜치·이슈 관계에서 아는 만큼 채운다. 선행/후속이 없으면 템플릿 안내대로 "의존성 없음".
- **기존 시스템 대비 변경 표**: 커밋·diff에서 3~7행을 뽑는다. 리뷰어가 diff를 안 봐도 알게.
- **검증 섹션**: 이 레포에서 실제 도는 명령만(`CLAUDE.md` Commands 기준):
  `pnpm --filter @repo/web check-types`, `pnpm --filter @repo/web exec vitest run --project unit <경로>`,
  변경 파일 `pnpm exec eslint --max-warnings 0 ...`, `git diff --check`.
- **PR 제목**도 함께 제안: `type(scope): 한 줄 요약`(한글, 이슈 제목/주요 커밋 테마 기반).

> 템플릿에 없는 섹션을 임의로 추가하지 않는다. 구조 변경이 필요하면 그건 이 스킬이 아니라
> `.github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md`를 고치는 별도 작업이다(팀 합의 대상).

---

## [GATE] 초안 검토

완성한 **제목 + 채워진 템플릿 초안을 사용자에게 보여주고 검토·승인을 받는다.**

```
[GATE] 사용자가 초안을 승인(또는 수정 반영)할 때까지 3단계로 넘어가지 않는다.
```

PR은 팀 공개 산출물이다. 틀린 서술·과장된 완료 표시가 그대로 나가면 안 된다.

---

## 3단계: 처리 방식 선택

승인된 초안을 어떻게 처리할지 **`AskUserQuestion`으로 명시적으로 선택받는다.**
(바로 올리는 것은 외부 공개 행위라 사용자 결정 없이 자동 실행하지 않는다.)

- **옵션 A — gh CLI로 바로 PR 올리기**
- **옵션 B — 로컬 파일로만 저장** (`.local-docs/pr/pr-#N.md`)

### 옵션 A: gh로 등록

1. `gh auth status` 확인(실패 시 `gh auth login` 안내 후 옵션 B 폴백 제안).
2. 원격에 브랜치 없으면 push: `git push -u origin <현재브랜치>`. **`main`/`develop` 직접 push 금지.**
3. 등록: `gh pr create --base develop --head <브랜치> --title "<제안 제목>" --body-file <임시파일>`
   - 이 템플릿은 `.github/PULL_REQUEST_TEMPLATE/` 하위 후보라 GitHub UI가 자동 주입하진 않지만, 여기선 이미 채운 본문을 `--body-file`로 넘긴다.
4. 반환된 PR URL 전달(임시 파일 정리).

### 옵션 B: 로컬 저장

`.local-docs/pr/pr-#<이슈번호>.md`. `.local-docs/`는 gitignore된 스크래치라 안전하다.
폴더 없으면 만들고, 파일이 있으면 덮어쓸지 확인한다. 경로를 알리고 나중에 옵션 A로 올릴 수 있음을 덧붙인다.

---

## 요약 체크리스트

- [ ] `git branch --show-current`로 이슈 번호 추출(못 찾으면 질의)
- [ ] `develop..HEAD` 커밋·diff로 실제 변경 파악
- [ ] `.github/PULL_REQUEST_TEMPLATE/2-pr-writer-gh-template.md`를 읽어 **구조 그대로** 채움(주석 제거, 없는 섹션 추가 금지)
- [ ] 커밋·검증된 것만 `[x]`, 미완은 `[ ]`
- [ ] 검증 섹션에 실제 도는 명령만
- [ ] 초안 보여주고 **승인**(GATE)
- [ ] gh 등록 / 로컬 저장을 **사용자에게 선택**
- [ ] 커밋·코드 미변경(PR 본문·등록만)
