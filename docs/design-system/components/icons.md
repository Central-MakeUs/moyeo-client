# Icons — 🎨 시안만

> Source: Figma `ic-caret`, `ic-chevron`, `ic-close`, `ic-plus`, `ic-minus`, `ic-checkbox`, `check`
> 코드에서는 현재 `lucide-react`를 사용한다(예: Calendar의 Chevron). 아래는 시안 아이콘 목록이다.

## 아이콘 목록

| 시안          | 모양     | 용도                         | 현재 매핑          |
| ------------- | -------- | ---------------------------- | ------------------ |
| `ic-caret`    | ▲ ▼      | Select/드롭다운 펼침 표시    | (미구현)           |
| `ic-chevron`  | ∧ ∨ ‹ ›  | 네비게이션(월 이동, 뒤로 등) | `lucide` Chevron\* |
| `ic-close`    | ×        | 닫기/삭제                    | (미구현)           |
| `ic-plus`     | +        | 추가/증가 (비활성 상태 포함) | (미구현)           |
| `ic-minus`    | −        | 감소                         | (미구현)           |
| `ic-checkbox` | ☐ / 🔴✓  | 체크박스 off/on              | → `controls.md`    |
| `check`       | ✓ (빨강) | 체크 표시                    | (미구현)           |

## 원칙

- 아이콘은 currentColor를 따르도록 그려 텍스트 색 토큰과 함께 제어한다.
- 크기는 버튼 규격을 따른다(기본 `size-4`). 임의 픽셀 크기 지정을 피한다.
- 시안 아이콘을 SVG 컴포넌트로 정식 편입할지, `lucide-react`로 계속 대체할지는
  **아이콘 정책 확정 시** 결정한다. (현재는 혼용)
