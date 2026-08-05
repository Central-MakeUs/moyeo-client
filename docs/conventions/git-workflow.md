# Git 워크플로우 (흐름)

브랜치를 **어떻게 흘려보내고 배포하는지**. 커밋/브랜치 형식은 [git-conventions.md](./git-conventions.md).

## 브랜치 구조

| 브랜치      | 역할                                  | 분기 기준 |
| ----------- | ------------------------------------- | --------- |
| `main`      | 프로덕션 배포 브랜치                  | —         |
| `develop`   | 다음 배포를 준비하는 개발 통합 브랜치 | —         |
| `release/*` | 배포 전 QA / 안정화                   | `develop` |
| `hotfix/*`  | 프로덕션 긴급 수정                    | `main`    |
| `feat/*`    | 기능 개발                             | `develop` |
| `fix/*`     | 일반 버그 수정                        | `develop` |

## 머지 전략

| 머지 방향             | 방식             | 목적                             |
| --------------------- | ---------------- | -------------------------------- |
| `feat` → `develop`    | Squash and Merge | 기능 작업 정리해 개발 반영       |
| `develop` → `release` | Merge            | 릴리즈 후보 생성                 |
| `release` → `main`    | Rebase and Merge | 운영 배포 반영                   |
| `hotfix` → `main`     | Rebase and Merge | 운영 긴급 수정 반영              |
| `main` → `develop`    | Merge            | 배포/핫픽스 변경을 개발에 동기화 |

## 개발 흐름

### 일반 기능 개발

```
feat/#이슈번호/설명 → develop → release/x.y.z → main → tag vx.y.z
```

```bash
git checkout develop
git pull origin develop
git checkout -b feat/#10/login-page
```

### 배포 준비

`develop` 에서 `release` 를 생성한다. release에서는 새 기능 개발 없이 QA·버그 수정·버전 수정만.

```bash
git checkout develop && git pull origin develop
git checkout -b release/1.0.0
```

### 배포 확정

QA 완료 후 `release` 를 `main` 에 머지하고 태그를 찍는다. 수정 내용은 `develop` 에도 반영.

```bash
git checkout main && git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

git checkout develop
git merge release/1.0.0
git push origin develop
```

배포 후 `release` 브랜치는 삭제한다 (기록은 태그로 남는다).

### 긴급 수정

운영 버그는 `main` 에서 `hotfix` 를 생성, 수정 후 `main` 과 `develop` 양쪽에 반영하고 패치 태그를 찍는다.

```bash
git checkout main && git pull origin main
git checkout -b hotfix/1.0.1-login-bug
# 수정 후
git checkout main
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1
git checkout develop && git merge hotfix/1.0.1-login-bug && git push origin develop
```

## 버전 태그

브랜치가 아닌 `git tag` 로 버전을 관리한다.

```
v{major}.{minor}.{patch}
v1.0.0   # 최초 릴리즈
v1.1.0   # 기능 추가
v1.1.1   # 버그 수정
```

## 운영 규칙

- `main` 직접 push 금지. `develop` 도 PR로만 머지.
- `feat` / `fix` 는 `develop` 에서, `release` 는 `develop` 에서, `hotfix` 는 `main` 에서 생성.
- `release` 브랜치에서 새 기능 개발 금지.
- 배포 버전은 태그로 기록하고, `release` 브랜치는 배포 후 삭제.

## 로컬 훅 (husky + lint-staged)

커밋 시 자동 실행된다.

- **pre-commit** (`lint-staged`): 변경 파일에 `eslint --fix` + `prettier --write`,
  web `src` 변경 시 `steiger` FSD 검사.
- **commit-msg** (`commitlint`): 커밋 메시지 형식 검사 ([git-conventions.md](./git-conventions.md)).

## CI

> 현재 `.github/workflows/` 가 없어 **PR 자동 검사 파이프라인은 아직 없다.**
> 도입 시 PR에서 아래를 통과 조건으로 거는 것을 목표로 한다.

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```
