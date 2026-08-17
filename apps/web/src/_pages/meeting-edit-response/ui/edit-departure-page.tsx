'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { DepartureRadioGroup } from '@/features/meeting/create-meeting';
import {
  toEditDepartureSearchPath,
  useEditDepartureDraft,
  useMyParticipation,
  useSaveMyResponse,
} from '@/features/meeting/edit-response';
import { InputButton } from '@/shared/ui/input-button';

import { isSameDeparture } from '../model/is-same-response';
import { toDepartureSeed } from '../model/to-departure-seed';
import { useCloseEditScreen } from '../model/use-close-edit-screen';
import { useInviteCodeParam } from '../model/use-invite-code-param';
import { EditResponseLayout } from './edit-response-layout';

/**
 * 내가 낸 출발지·이동수단을 고치는 화면(INV-03과 같은 구성).
 *
 * 출발지 검색이 별도 화면이라 아직 저장하지 않은 값은 초안 스토어에 둔다. 컴포넌트 상태로
 * 들면 검색을 다녀오는 사이에 사라진다.
 */
export function EditDeparturePage(): React.JSX.Element {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <EditDepartureContent />
    </React.Suspense>
  );
}

function EditDepartureContent(): React.JSX.Element {
  const router = useRouter();
  const inviteCode = useInviteCodeParam();
  const { data, isLoading, isError } = useMyParticipation(inviteCode);
  const close = useCloseEditScreen(inviteCode, 'place');
  const { saveDeparture, isSaving } = useSaveMyResponse(inviteCode, { onSaved: close });

  const departure = useEditDepartureDraft((state) => state.departure);
  const transportationMode = useEditDepartureDraft((state) => state.transportationMode);
  const setTransportationMode = useEditDepartureDraft((state) => state.setTransportationMode);
  const open = useEditDepartureDraft((state) => state.open);

  // 서버 값으로 초안을 연다. 이미 이 모임을 편집 중이면 open이 알아서 덮지 않는다.
  React.useEffect(() => {
    if (data) open(inviteCode, toDepartureSeed(data.departure));
  }, [data, inviteCode, open]);

  if (!data) {
    return <EditResponseLayout onBack={close} isLoading={isLoading} isError={isError} />;
  }

  const isComplete = departure !== null && transportationMode !== null;
  // 서버 값을 초안과 같은 형태로 맞춰 비교한다. 되돌려 원래대로 오면 다시 잠긴다.
  const isUnchanged = isSameDeparture(toDepartureSeed(data.departure), {
    departure,
    transportationMode,
  });

  return (
    <EditResponseLayout
      onBack={close}
      title="출발지와 이동수단을 알려주세요"
      description="모두에게 공평한 위치를 찾아드릴게요"
      isSaveDisabled={!isComplete || isUnchanged}
      isSaving={isSaving}
      onSave={() => {
        if (!isComplete) return;

        void saveDeparture({
          name: departure.name,
          address: departure.address,
          latitude: departure.latitude,
          longitude: departure.longitude,
          transportationMode,
        });
      }}
    >
      <div className="flex w-full flex-col gap-4">
        <InputButton
          label="출발지"
          value={departure?.name}
          placeholder="출발지를 입력해주세요"
          onClick={() => router.push(toEditDepartureSearchPath(inviteCode))}
        />

        <div className="flex flex-col gap-2.5">
          <span className="text-medium-14 text-neutral-600" id="transportation-mode-label">
            교통수단을 선택해주세요
          </span>
          <DepartureRadioGroup
            aria-labelledby="transportation-mode-label"
            value={transportationMode ?? ''}
            onChangeValue={setTransportationMode}
          />
        </div>
      </div>
    </EditResponseLayout>
  );
}
