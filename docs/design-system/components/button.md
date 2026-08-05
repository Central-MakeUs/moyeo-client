# Button — ✅ 구현

> Source: Figma `button-filled`, `button-ic` / `shared/ui/primitives/button/button.tsx`
> `class-variance-authority(cva)` 기반. `asChild`(radix Slot) 지원.

## Variant

| variant                                  | 상태      | 스타일                                                 |
| ---------------------------------------- | --------- | ------------------------------------------------------ |
| `default`                                | ✅ 구현   | 채운(filled) primary 버튼. 텍스트 `primary-foreground` |
| `ghost`                                  | ✅ 구현   | 배경 없음. disabled 시 텍스트 `neutral-200`            |
| outline / secondary / destructive / link | ⬜ 미구현 | cva에 자리만 있고 주석 처리됨                          |

### `default` 상태별 배경 (상호작용 단계 = accessible 스케일)

| 상태          | 배경                  |
| ------------- | --------------------- |
| 기본          | `primary` (`#f43630`) |
| hover         | `accessible-400`      |
| focus-visible | `accessible-600`      |
| active(press) | `accessible-700`      |
| disabled      | `neutral-70`          |

> Figma `button-filled`의 빨강 4단계(밝음→어두움 + 옅은 톤)는 위 hover/active/press 상태에 대응한다.

## Size

| size      | 값                                          | 용도                             |
| --------- | ------------------------------------------- | -------------------------------- |
| `default` | `h-12`, `px-2.5`, `gap-1.5`, `text-bold-16` | 기본 텍스트 버튼 (모서리 8px)    |
| `icon`    | `size-7.5`, `rounded-[6px]`, 배경 `white`   | 정사각 아이콘 버튼 (`button-ic`) |

`icon` 상태색: 기본 아이콘 `neutral-100`, hover 배경 `neutral-20`, active 배경 `neutral-50`.

## 기타 옵션

- `fullWidth`: `true` 시 `w-full`. CTA 섹션의 가로 꽉 찬 버튼에 사용.
- 아이콘 슬롯: `data-icon="inline-start | inline-end"` 로 좌/우 패딩 자동 보정.
- 접근성: `focus-visible`에 `ring-3 ring-ring/50`, 폼 에러 시 `aria-invalid` 스타일.

## 공통 규격

- 모서리: **8px** (`rounded-md`), 아이콘 버튼은 6px (`rounded-[6px]`).
  > ⚠️ 현재 코드는 `rounded-lg`로 지정돼 **10px로 렌더링되는 버그**가 있다. Tailwind 기본 `rounded-lg`=8px인 줄 알고 쓴 리매핑 함정 — `rounded-md`(=8px)로 수정 필요. ([radius 문서](../foundations/radius.md) 참고)
- 라벨 타이포: `text-bold-16`.
- press 시 `active:translate-y-px` 미세 눌림 모션 (팝업 트리거 제외).

## 원칙

- Primary 액션은 `default` variant 하나로 통일한다. 상태색을 임의 지정하지 말고 위 단계를 따른다.
- 신규 variant가 필요하면 임의 클래스 대신 cva `variants`에 정식 추가한다.
