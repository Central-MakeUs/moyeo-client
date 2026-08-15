# 타이포그래피 토큰

> Source: Figma `타이포그래피`, `globals.css @theme`
> 폰트는 **SUIT** 하나만 사용한다 (`--font-suit`). 스케일과 무게로 위계를 만든다.

## 스타일 스케일

Figma 스타일명 = Tailwind 유틸리티명이 1:1로 매칭된다. (예: `text-bold-16`)
각 스타일은 크기·행간·굵기가 한 세트로 묶여 있다. 행간 `auto`는 CSS `line-height: normal`로 매핑한다.

| 스타일         | Tailwind            | 크기            | 행간 | 굵기            |
| -------------- | ------------------- | --------------- | ---- | --------------- |
| `extrabold-22` | `text-extrabold-22` | 22px (1.375rem) | 140% | 800 (ExtraBold) |
| `extrabold-20` | `text-extrabold-20` | 20px (1.25rem)  | 140% | 800 (ExtraBold) |
| `extrabold-18` | `text-extrabold-18` | 18px (1.125rem) | 150% | 800 (ExtraBold) |
| `bold-18`      | `text-bold-18`      | 18px (1.125rem) | 125% | 700 (Bold)      |
| `extrabold-16` | `text-extrabold-16` | 16px (1rem)     | auto | 800 (ExtraBold) |
| `bold-16`      | `text-bold-16`      | 16px (1rem)     | 125% | 700 (Bold)      |
| `semibold-16`  | `text-semibold-16`  | 16px (1rem)     | 150% | 600 (SemiBold)  |
| `medium-16`    | `text-medium-16`    | 16px (1rem)     | 150% | 500 (Medium)    |
| `extrabold-14` | `text-extrabold-14` | 14px (0.875rem) | auto | 800 (ExtraBold) |
| `bold-14`      | `text-bold-14`      | 14px (0.875rem) | 140% | 700 (Bold)      |
| `semibold-14`  | `text-semibold-14`  | 14px (0.875rem) | 150% | 600 (SemiBold)  |
| `medium-14`    | `text-medium-14`    | 14px (0.875rem) | 140% | 500 (Medium)    |
| `bold-12`      | `text-bold-12`      | 12px (0.75rem)  | 140% | 700 (Bold)      |
| `semibold-12`  | `text-semibold-12`  | 12px (0.75rem)  | 150% | 600 (SemiBold)  |
| `medium-12`    | `text-medium-12`    | 12px (0.75rem)  | 150% | 500 (Medium)    |
| `extrabold-8`  | `text-extrabold-8`  | 8px (0.5rem)    | auto | 800 (ExtraBold) |

## 대표 용도 (코드·시안 기준)

| 스타일         | 쓰이는 곳                                                   |
| -------------- | ----------------------------------------------------------- |
| `extrabold-22` | 화면 타이틀, 강조 헤드라인                                  |
| `extrabold-20` | 온보딩 슬라이드 타이틀                                      |
| `bold-16`      | **버튼 라벨**, 섹션 제목                                    |
| `bold-14`      | 소제목, 선택된 항목 강조                                    |
| `semibold-16`  | 리스트/카드 주요 텍스트                                     |
| `medium-16`    | 본문 입력값                                                 |
| `medium-14`    | 보조 설명, 메타                                             |
| `medium-12`    | 캡션, 라벨(가장 작은 텍스트)                                |
| `bold-12`      | 뱃지·칩 안의 짧은 숫자/라벨 (예: 아바타 그룹 오버플로 `+N`) |

나머지(`extrabold-18`, `bold-18`, `extrabold-16`, `extrabold-14`, `semibold-12`, `extrabold-8`)는
아직 코드에서 실사용처가 없다 — Figma 스타일 전체를 토큰으로만 먼저 반영해 둔 상태다.

## 원칙

- 임의 `font-size` / `font-weight` 조합 금지. 위 16개 스타일 안에서만 선택한다.
- 크기가 같아도 굵기로 위계를 만든다 (예: `semibold-16` 본문 vs `bold-16` 강조).
- 16개로 표현이 안 되는 케이스가 생기면 임의 값 추가 대신 **디자이너에게 스타일 추가를 요청**한다.
