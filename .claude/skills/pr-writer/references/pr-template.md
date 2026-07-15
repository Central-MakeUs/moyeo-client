# PR 템플릿 · 톤 레퍼런스

이 스킬이 생성하는 PR은 아래 **구조·톤**을 따른다. 섹션은 작업 성격에 맞게 가감하되,
`## 이슈` / `## 작업 배경` / `## 기존 시스템 대비 변경`(표) / `## 완료 조건` / `## 검증` /
`## 리뷰 포인트` / `## 기타`는 기본 골격으로 유지한다.

## 섹션 가이드

- **이슈** — `Closes #N` 한 줄.
- **작업 배경** — 왜 했는가. 기존의 구체적 문제 → 이번 접근. 격식체 2~3문단.
- **기존 시스템 대비 변경** — `| 구분 | 기존 | 변경 |` 표. 이 PR의 핵심 요약. 3~7행.
- **핵심 구조/사용법** — 컴포넌트/모듈이면 사용 예시 코드블록 + 각 부분의 책임을 불릿으로.
- **추가 설계 포인트** — 레이아웃·상태·정책·경계 등 리뷰에 필요한 결정들(필요한 만큼).
- **작업 범위** — 영역별 세부 변경(중첩 불릿). 커밋을 근거로.
- **완료 조건** — 체크박스. **검증된 것만 `[x]`**, 미완(머지 등)은 `[ ]`.
- **검증** — 실제 도는 명령 코드블록 + "확인 결과" 체크리스트.
- **리뷰 포인트** — 리뷰어가 판단해줬으면 하는 설계 결정을 질문형으로.
- **기타** — 범위 밖·후속 이슈·현재 한계·폴백 동작.

## 톤 원칙

- 격식체(~합니다/했습니다), 구조적, 담백. 과장·홍보성 표현 지양.
- 표·코드블록·디렉터리 트리로 시각화. 긴 산문보다 구조화.
- 정직성: 안 끝난 것을 완료로 쓰지 않는다. 안 돌려본 명령을 통과로 쓰지 않는다.

---

## 원본 예시 (moyeo Drawer PR, #43) — 톤·구조 참고용

> 이 예시의 문장 톤·표 구성·섹션 흐름을 기준으로 삼는다. 내용은 그대로 베끼지 말고
> 현재 브랜치의 커밋에서 뽑은 사실로 채운다.

## 이슈

Closes #43

## 작업 배경

모바일 WebView에서 사용하는 Drawer를 서비스 디자인에 맞게 구성하고, Drawer가 브라우저 전체가 아닌 앱 셸 영역 안에서 열리도록 Portal 렌더링 구조를 정리했습니다.

기존 Drawer는 `shared/ui/primitives/drawer.tsx` 단일 파일에 위치한 기본 primitive 형태여서 Handle, Header, 스크롤 콘텐츠, 하단 CTA 영역의 레이아웃 책임이 명확하지 않았습니다. 특히 내용이 길어졌을 때 Header와 Footer를 유지하면서 본문만 스크롤하는 구조와, Figma 모바일 시안 기준의 높이·여백을 일관되게 표현하기 어려웠습니다.

또한 Vaul Portal의 기본 렌더링 대상은 `document.body`이므로, 최대 480px인 앱 셸보다 넓은 데스크톱 환경에서 Overlay와 Drawer가 브라우저 전체를 기준으로 표시될 수 있었습니다. 이를 해결하기 위해 AppLayout에 전용 overlay container를 추가하고, Vaul Root와 Portal이 동일한 container를 사용하도록 연결했습니다.

## 기존 시스템 대비 변경

| 구분        | 기존                                       | 변경                                             |
| ----------- | ------------------------------------------ | ------------------------------------------------ |
| 파일 구조   | `primitives/drawer.tsx` 단일 파일          | `shared/ui/drawer` 디렉터리 및 public index 구성 |
| 레이아웃    | Content 내부 영역의 책임이 불명확          | Handle, Header, Body, Footer로 역할 분리         |
| 스크롤      | Drawer 전체가 콘텐츠에 따라 늘어날 수 있음 | Header/Footer는 고정하고 Body만 스크롤           |
| Portal 범위 | 기본 `document.body` 기준                  | AppLayout의 overlay container 기준               |

## Drawer 구조

```tsx
<Drawer>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>참여 인원 선택</DrawerTitle>
    </DrawerHeader>
    <DrawerBody>{/* 스크롤 콘텐츠 */}</DrawerBody>
    <DrawerFooter>
      <Button fullWidth>다음</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

각 영역은 다음 책임을 가집니다.

- `DrawerContent`: Drawer 패널의 위치, 높이 제한 및 flex 레이아웃
- `DrawerBody`: 남은 공간을 채우고 내용이 넘칠 때 세로 스크롤
- `DrawerFooter`: 하단에 고정되는 CTA 영역

## 완료 조건

- [x] Drawer가 앱 셸 최대 너비 안에서 열린다.
- [x] Header와 Footer는 유지되고 DrawerBody만 스크롤된다.
- [ ] PR 머지

## 검증

```bash
pnpm --filter @repo/web check-types
git diff --check
```

확인 결과:

- [x] 웹 타입 검사 통과
- [x] 변경 소스 ESLint 통과

## 리뷰 포인트

- AppLayout이 OverlayRoot를 소유하고 Portal container를 Context로 제공하는 구조가 적절한지
- Drawer의 public 방향을 bottom으로 제한한 판단이 제품 요구사항과 일치하는지

## 기타

- 이번 PR은 Drawer와 렌더링에 필요한 AppLayout/Overlay 기반 구성만 포함합니다.
- CTASection과 Calendar 변경은 별도 이슈 및 브랜치에서 진행합니다.
