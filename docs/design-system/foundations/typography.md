# 타이포그래피 토큰

> Source: Figma `타이포그래피`, `globals.css @theme`
> 폰트는 **SUIT** 하나만 사용한다 (`--font-suit`). 스케일과 무게로 위계를 만든다.

## 스타일 스케일

Figma 스타일명 = Tailwind 유틸리티명이 1:1로 매칭된다. (예: `text-bold-16`)
각 스타일은 크기·행간·굵기가 한 세트로 묶여 있다.

| 스타일         | Tailwind            | 크기            | 행간 | 굵기            |
| -------------- | ------------------- | --------------- | ---- | --------------- |
| `extrabold-22` | `text-extrabold-22` | 22px (1.375rem) | 140% | 800 (ExtraBold) |
| `bold-16`      | `text-bold-16`      | 16px (1rem)     | 125% | 700 (Bold)      |
| `bold-14`      | `text-bold-14`      | 14px (0.875rem) | 140% | 700 (Bold)      |
| `semibold-16`  | `text-semibold-16`  | 16px (1rem)     | 150% | 600 (SemiBold)  |
| `semibold-14`  | `text-semibold-14`  | 14px (0.875rem) | 150% | 600 (SemiBold)  |
| `medium-16`    | `text-medium-16`    | 16px (1rem)     | 150% | 500 (Medium)    |
| `medium-14`    | `text-medium-14`    | 14px (0.875rem) | 140% | 500 (Medium)    |
| `medium-12`    | `text-medium-12`    | 12px (0.75rem)  | 150% | 500 (Medium)    |

## 대표 용도 (코드·시안 기준)

| 스타일         | 쓰이는 곳                    |
| -------------- | ---------------------------- |
| `extrabold-22` | 화면 타이틀, 강조 헤드라인   |
| `bold-16`      | **버튼 라벨**, 섹션 제목     |
| `bold-14`      | 소제목, 선택된 항목 강조     |
| `semibold-16`  | 리스트/카드 주요 텍스트      |
| `medium-16`    | 본문 입력값                  |
| `medium-14`    | 보조 설명, 메타              |
| `medium-12`    | 캡션, 라벨(가장 작은 텍스트) |

## 원칙

- 임의 `font-size` / `font-weight` 조합 금지. 위 8개 스타일 안에서만 선택한다.
- 크기가 같아도 굵기로 위계를 만든다 (예: `semibold-16` 본문 vs `bold-16` 강조).
- 8개로 표현이 안 되는 케이스가 생기면 임의 값 추가 대신 **디자이너에게 스타일 추가를 요청**한다.
