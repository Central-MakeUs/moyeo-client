type ClassValue = string | false | null | undefined;

export function cn(...classNames: ClassValue[]) {
  return classNames.filter(Boolean).join(' ');
}
