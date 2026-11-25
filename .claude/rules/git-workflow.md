# git 흐름 — AI가 지킬 것

브랜치 구조·머지 전략·배포 흐름의 원문은 **`docs/conventions/git-workflow.md`**,
커밋·브랜치 이름 형식은 **`docs/conventions/git-conventions.md`** 다. 여기서 다시 쓰지 않는다 — 두 곳에 있으면 한쪽만 고쳐진다.
이 문서는 **AI가 git을 다룰 때의 행동 규칙**만 담는다.

---

## 1. 요약 (원문과 다르면 원문이 맞다)

- 작업 브랜치는 `develop`에서 딴다. 이름은 `type/#이슈번호/설명`
- `feat/*` → `develop`은 **Squash**. `develop` → `release/x.y.z`(Merge) → `main`(Rebase) → 태그
- `main`·`develop` 직접 push 금지. PR로만
- 커밋은 `type(scope): 내용` — commitlint가 강제한다. pre-commit은 eslint --fix + prettier + steiger

## 2. 커밋·push·PR은 사용자가 한다

- **스테이징(`git add`)까지만 하고 멈춘다.** 커밋 메시지 초안은 제안할 수 있다
- `git push`, PR 생성·머지는 사용자가 명시적으로 요청했을 때만
- 훅(`--no-verify`)을 우회하지 않는다. 실패하면 원인을 고친다

## 3. 브랜치를 따기 전에

- 의존성·SDK 업그레이드는 **feature 브랜치에 얹지 않는다.** `develop`에서 전용 브랜치를 따고, 필요하면 워크트리로 분리한다
- 이슈 구현 범위는 로컬 미커밋 상태가 아니라 **`origin/develop` 기준**으로 판단한다

## 4. develop을 따라갈 때 — rebase

작업 브랜치는 혼자 쓰는 게 기본이다. `develop`이 앞서 나가면 rebase로 따라간다.

```bash
git fetch origin
git branch backup/<설명>          # 이력을 다시 쓰기 전에 되돌릴 지점
git rebase origin/develop
git push --force-with-lease       # --force 가 아니다 (push 는 사용자 승인 후)
```

다른 사람이 그 브랜치에서 작업 중이면 rebase하지 않고 merge하며, 사유를 PR에 남긴다.

### 스택 PR

- 아래 브랜치에서 ESLint 미사용 변수를 지우면 위 브랜치가 **충돌 없이 조용히 깨질 수 있다.** 제거 전 상위 브랜치의 사용처를 확인한다
- rebase 후 검증은 **diffstat 대조**로 충분하다. 스택 밖 변경을 흡수했을 때만 typecheck·테스트를 다시 돌린다

## 5. 편집기 없이 rebase

AI 도구는 대화형 편집기를 열 수 없다. `rebase -i`가 필요하면 `GIT_SEQUENCE_EDITOR`에 스크립트를 넣어 todo를 바꾼다.
정리 후에는 **최종 결과가 같은지** 확인한다.

```bash
git diff backup/<설명> HEAD    # 차이가 의도한 것뿐인지
```

## 6. 되돌리기 어려운 명령

`reset --hard`, `push --force`, `branch -D`, `clean -f`, `checkout -- <파일>`은 **실행 전 사용자에게 확인**한다.
작업 트리에 미커밋 변경이 있으면 먼저 `git status`로 보고 알린다.
