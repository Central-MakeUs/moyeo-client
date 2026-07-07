import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// 커스텀 텍스트 토큰: text-{weight}-{size}
// weight 를 명시해 색상 토큰(text-neutral-900 등)과 구분 → font-size 그룹으로만 등록.
// 새 size 는 자동 커버, 새 weight 추가 시에만 아래 목록에 단어 추가.
const isCustomText = (value: string) =>
  /^(extrabold|bold|semibold|medium|regular)-\d+$/.test(value);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [isCustomText] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
