# Git 컨벤션 (형식)

커밋·브랜치·이슈·PR을 **어떤 형식으로 쓰는지**. 흐름/배포 절차는 [git-workflow.md](./git-workflow.md).

## 커밋 메시지

```
type(scope): 작업 내용
```

- `type` 은 필수, `scope` 는 선택(작업 범위가 명확할 때만).
- commitlint(`@commitlint/config-conventional`)로 커밋 시 자동 검사한다.

예시:

```
feat(web): 로그인 페이지 구현
fix(native): 웹뷰 로딩 오류 수정
refactor(shared): 버튼 컴포넌트 구조 개선
chore(config): ESLint 설정 추가
docs: README 작성
init: 프로젝트 초기 세팅
```

### type

| type       | 설명                                         |
| ---------- | -------------------------------------------- |
| `feat`     | 새로운 기능 추가                             |
| `fix`      | 버그 수정                                    |
| `docs`     | 문서 수정                                    |
| `style`    | 코드 스타일 변경 (포맷팅 등, 동작 변화 없음) |
| `design`   | 사용자 UI 디자인 변경 (CSS 등)               |
| `refactor` | 코드 리팩토링                                |
| `test`     | 테스트 코드                                  |
| `perf`     | 성능 개선                                    |
| `build`    | 빌드 파일 수정                               |
| `ci`       | CI 설정 수정                                 |
| `chore`    | 기타 (패키지 설정 등, 운영 코드 변화 없음)   |
| `rename`   | 파일/폴더명 수정                             |
| `remove`   | 파일 삭제만 한 경우                          |
| `init`     | 프로젝트 초기 세팅                           |
| `revert`   | 커밋 되돌리기                                |

### scope

`web` · `native` · `docs` · `shared` · `config` · `repo` · `storybook`

## 브랜치명

```
type/#이슈번호/설명
```

```
feat/#10/login-page
fix/#12/auth-error
refactor/#15/button-component
```

## 이슈

제목: `[type] 내용`

```
[feat] 로그인 페이지 구현
[fix] 로그인 에러 수정
```

템플릿은 `.github/ISSUE_TEMPLATE/` 를 따른다 (Feature / Bug / Task).

- **Feature**: 설명 / 작업할 내용(체크박스) / 참고 자료
- **Bug**: 버그 설명 / 재현 방법 / 예상 동작 / 환경 정보
- **Task**: 작업 단위 이슈

## PR

제목: `[type] 내용` (여러 작업이면 `+` 로 구분, 예: `[feat/refactor] ...`)

권장 템플릿 항목 (현재 레포에 PR 템플릿 파일은 없음 — 팀 표준 형식):

- 이슈 번호 (`Closes #`)
- 작업 사항 ("어떻게"보다 "무엇"을 "왜")
- 스크린샷 (없으면 목차 삭제)
- 공유 사항
- 참고 자료
- 체크리스트 (`pnpm typecheck` / `pnpm lint` / `pnpm build`)

### PR 규칙

- PR은 가능한 하나의 이슈와 연결한다.
- 본인을 제외한 팀원 1명 이상 Approve 후 머지.
- Conflict는 PR 담당자가 해결한다.
- 라벨은 작업 커밋의 type 기준으로 설정한다.
