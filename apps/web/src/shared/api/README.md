# shared/api

HTTP client 설정, Orval 생성 API client, transport-level DTO, 토큰 저장을 관리한다.

## 구조

```text
shared/api/
├─ generated/           # Orval 생성 전용. 직접 수정하지 않는다.
│  └─ schemas/          # OpenAPI schema에서 생성한 transport DTO
├─ axios-instance.ts    # Axios 공통 instance, Orval mutator, 인증 인터셉터
├─ token-storage.ts     # 액세스 토큰 저장 (localStorage)
├─ index.ts             # 공개 API 배럴 (@/shared/api)
└─ README.md
```

- `generated`는 `orval.config.ts`의 `clean: true` 대상이다. 수동 작성 파일을 이 디렉터리에
  추가하지 않는다.
- 상위 FSD layer는 `shared/api`를 사용할 수 있지만, `shared/api`는 상위 layer를 import하지
  않는다.

## 공개 API (배럴)

상위 layer는 `@/shared/api`(배럴)로만 접근하고 `generated` 내부 경로를 직접 import하지 않는다.
`index.ts`가 axios instance · token-storage · Orval 생성 client/schema를 재노출한다.

## Axios instance

`axios-instance.ts`의 `customInstance`는 Orval이 생성한 TanStack Query client에서 사용하는
mutator다. Axios 응답 전체가 아니라 `response.data`를 반환한다.

실행 환경별 API 주소는 다음 환경 변수로 주입한다.

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

요청 인터셉터가 `token-storage`의 `getToken()`으로 저장된 액세스 토큰을 읽어
`Authorization: Bearer` 헤더를 자동 부착한다(토큰이 없거나 SSR이면 생략).
refresh token은 미도입이라 401 refresh interceptor는 아직 없다.

## 생성

OpenAPI 문서는 `orval.config.ts`의 `input.target`에서 읽고, 결과물은 `generated` 아래에
생성한다.

```bash
pnpm --filter @repo/web exec orval --config orval.config.ts
```

생성 파일은 직접 수정하지 않고 OpenAPI 문서 또는 Orval 설정을 수정한 뒤 다시 생성한다.
