# 팀 컨벤션

Moyeo 프론트엔드 팀의 개발 컨벤션 모음이다. 처음 합류했거나 규칙이 기억나지 않을 때 여기서 찾는다.

> 이 문서들은 **팀 합의(사람 기준)** 를 정리한 것이다.
> 코드 에이전트/도구가 참고하는 실행 기준은 루트 `CLAUDE.md`, 디자인 값은 `docs/design-system/` 을 함께 본다.

## 문서 지도

### 팀 컨벤션 문서

| 문서                                           | 언제 보나                                         |
| ---------------------------------------------- | ------------------------------------------------- |
| [tech-stack.md](./tech-stack.md)               | 무슨 기술을 쓰는지 (스택 전체)                    |
| [project-structure.md](./project-structure.md) | 어디에 코드를 두는지 (모노레포 + FSD)             |
| [code-conventions.md](./code-conventions.md)   | 어떻게 쓰는지 (네이밍·TypeScript·ESLint·Prettier) |
| [git-conventions.md](./git-conventions.md)     | 커밋·브랜치·이슈·PR을 어떤 형식으로 쓰는지        |
| [git-workflow.md](./git-workflow.md)           | 브랜치를 어떻게 흘려보내고 배포하는지             |

### Claude 스킬 사용법

| 스킬                | 무엇을 할 때 쓰나                                         | 팀원용 사용법                           |
| ------------------- | --------------------------------------------------------- | --------------------------------------- |
| `feature-planner`   | 기능 아이디어를 PRD·스펙·개발 가능한 이슈로 나눌 때       | 작성 예정                               |
| `issue-reviewer`    | 이슈의 수직 슬라이싱·Acceptance Criteria·품질을 검토할 때 | 작성 예정                               |
| `security-review`   | 커밋 전 타입 오류·의존성 취약점·시크릿 노출을 점검할 때   | 작성 예정                               |
| `tdd-red`           | 승인된 시나리오를 실패하는 테스트로 작성할 때             | 작성 예정                               |
| `tdd-green`         | 실패 테스트를 통과시키는 최소 구현을 작성할 때            | 작성 예정                               |
| `tdd-refactor`      | 테스트 통과 상태를 유지하며 코드 구조를 개선할 때         | 작성 예정                               |
| `test-scenarios`    | 이슈의 구현 시그니처와 테스트 시나리오를 확정할 때        | 작성 예정                               |
| `user-flow-diagram` | Figma·기획에서 Mermaid 유저 플로우를 생성·갱신할 때       | [사용법](./skills/user-flow-diagram.md) |

## 치트시트

가장 자주 찾는 것만 모았다. 상세는 각 문서 참고.

**명령어 (루트)**

```bash
pnpm dev         # web(:3000) + docs(:3001)
pnpm build       # 전체 빌드
pnpm lint        # 린트
pnpm typecheck   # 타입 체크
pnpm format      # 포맷 정리
# pnpm test — 아직 미연결 (테스트 하네스 이슈 후 활성)
```

**커밋 메시지**

```
type(scope): 내용        예) feat(web): 모임 생성 캘린더 추가
```

- type: `feat fix docs style design refactor test perf build ci chore rename remove init revert`
- scope(선택): `web native docs shared config repo storybook`

**브랜치명**

```
type/#이슈번호/설명       예) feat/#31/customize-calendar
```

**파일명**

- 컴포넌트 파일: `kebab-case` (`input-field.tsx`), export는 named
- 폴더: `kebab-case`
- 코드 내부: 컴포넌트/타입 `PascalCase`, 변수/함수 `camelCase`, 상수 `SNAKE_CASE`
