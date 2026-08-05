# 그리드 & 스페이싱

> Source: Figma `그리드 시스템`, `globals.css`

## 그리드 시스템

기준 화면과 컬럼 그리드는 확정되어 있다. **간격은 16px를 기본**으로 하고,
화면 너비에 맞춰 유연하게 대응하는 컬럼 그리드를 사용한다.

| 항목        | 값        | 설명                    |
| ----------- | --------- | ----------------------- |
| Screen Size | 360 × 800 | 기준 모바일 해상도 (dp) |
| Margin      | 20        | 화면 좌우 바깥 여백     |
| Gutter      | 16        | 컬럼 사이 간격          |
| Columns     | 4         | 컬럼 개수               |

### 앱 컨테이너

실제 앱은 모바일 폭을 기준으로 하되, 넓은 화면에서는 중앙 정렬된 셸로 감싼다.
(`globals.css` `@layer components`)

```css
.app-shell {
  min-height: 100dvh;
  width: 100%;
  max-width: 480px; /* 모바일 셸 최대 폭 */
  margin-inline: auto; /* 중앙 정렬 */
  display: flex;
  flex-direction: column;
}
```

---

## 스페이싱 — 🔴 미확정

**별도 spacing 디자인 토큰은 아직 확정되지 않았다.** 확정 전까지는
**Tailwind 기본 spacing scale**(1 unit = `0.25rem` = 4px)을 그대로 사용한다.

| 예시 클래스 | 값         | 환산 |
| ----------- | ---------- | ---- |
| `p-1`       | `0.25rem`  | 4px  |
| `gap-1.5`   | `0.375rem` | 6px  |
| `px-2.5`    | `0.625rem` | 10px |
| `gap-4`     | `1rem`     | 16px |

### 지침

- spacing은 Tailwind 스케일 클래스(`p-*`, `gap-*`, `m-*`)로만 쓰고 임의 px 하드코딩을 피한다.
- 컴포넌트 사이 간격은 그리드의 **Gutter 16px(`gap-4`)** 를 기본 리듬으로 삼는다.
- 화면 좌우 패딩은 **Margin 20px** 을 기준으로 한다. (Tailwind엔 20px 스텝이 없으므로
  `px-5`(20px)를 사용한다.)
- 정식 spacing 토큰이 확정되면 이 문서와 `@theme`를 함께 갱신한다.
