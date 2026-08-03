import { GuestEntryResponseEntryType } from '@/shared/api';

/**
 * `checkGuestEntry`의 `unknown` 응답에서 entryType을 꺼낸다. 아는 값이 아니면 `null`이고,
 * 호출부는 이동하지 않고 실패로 다룬다.
 *
 * OpenAPI 스펙의 200 응답에 스키마가 없어(400·404에 성공 스키마가 잘못 붙어 있다) 생성 코드가
 * `Promise<unknown>`을 준다. 스펙이 고쳐지면 이 함수는 지운다.
 */
export function toGuestEntryType(response: unknown): GuestEntryResponseEntryType | null {
  if (typeof response !== 'object' || response === null) return null;

  const { entryType } = response as { entryType?: unknown };

  if (
    entryType === GuestEntryResponseEntryType.NEW_GUEST ||
    entryType === GuestEntryResponseEntryType.EXISTING_GUEST
  ) {
    return entryType;
  }

  return null;
}
