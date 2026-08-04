import type { DepartureDraft } from '@/entities/place';
import type {
  DepartureRequestTransportationMode,
  MemberJoinRequest,
  ScheduleResponseRequest,
} from '@/shared/api';

import type { MemberIdentity } from './member-join-draft';

export interface MemberJoinDraftSnapshot {
  identity: MemberIdentity;
  scheduleResponse: ScheduleResponseRequest | null;
  departure?: DepartureDraft | null;
  transportationMode?: DepartureRequestTransportationMode | null;
}

export function toMemberJoinRequest({
  identity,
  scheduleResponse,
  departure = null,
  transportationMode = null,
}: MemberJoinDraftSnapshot): MemberJoinRequest {
  return {
    nickname: identity.nickname,
    ...(scheduleResponse === null ? {} : { scheduleResponse }),
    ...(departure === null || transportationMode === null
      ? {}
      : { departure: { ...departure, transportationMode } }),
  };
}
