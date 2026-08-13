'use client';

import * as React from 'react';

import {
  availabilityTimeRangesToCellKeys,
  cellKeysToAvailabilityTimeRanges,
} from '@/entities/meeting';
import { useServerToday } from '@/features/meeting/create-meeting';
import { useMyParticipation, useSaveMyResponse } from '@/features/meeting/edit-response';
import { buildGuestScheduleTimeGrid } from '@/features/meeting/invite-participation';
import {
  useGetInvitation,
  type ScheduleAvailabilityRequest,
  type ScheduleCandidateResponse,
} from '@/shared/api';
import {
  DraggableCalendar,
  formatScheduleCandidateDates,
  parseScheduleCandidateDates,
  toIsoDate,
  toLocalDate,
} from '@/shared/ui/calendar';
import { AvailabilityTimeGrid, buildCellKeysBeforeDate } from '@/shared/ui/time-grid';

import { isSameDates, isSameTimeRanges } from '../model/is-same-response';
import { useCloseEditScreen } from '../model/use-close-edit-screen';
import { useInviteCodeParam } from '../model/use-invite-code-param';
import { EditResponseLayout } from './edit-response-layout';

const CLOSED_NOTICE = '지금은 일정을 수정할 수 없어요';

/**
 * 내가 낸 일정 응답을 고치는 화면.
 *
 * 캘린더(`DATE_ONLY`)와 시간표(`DATE_AND_TIME`) 중 무엇을 띄울지는 참여 응답 조회가 준
 * `scheduleInputType`이 정한다. 유형을 따로 묻지 않는다.
 */
export function EditSchedulePage(): React.JSX.Element {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <EditScheduleContent />
    </React.Suspense>
  );
}

function EditScheduleContent(): React.JSX.Element {
  const inviteCode = useInviteCodeParam();
  const participation = useMyParticipation(inviteCode);
  const { serverToday, status: serverTodayStatus } = useServerToday();

  // 모임장이 열어 둔 후보. 고를 수 있는 범위를 여기서 얻는다.
  const invitation = useGetInvitation(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  const close = useCloseEditScreen(inviteCode, 'schedule');
  const { saveSchedule, isSaving } = useSaveMyResponse(inviteCode, { onSaved: close });

  /** 화면에서 고친 값. 아직 손대지 않았으면 `null`이고 서버 값을 그대로 보여준다. */
  const [edited, setEdited] = React.useState<{
    availableDates?: string[];
    availableTimeRanges?: ScheduleAvailabilityRequest[];
  } | null>(null);

  const isLoading =
    participation.isLoading || invitation.isLoading || serverTodayStatus === 'pending';
  const isError = participation.isError || invitation.isError || serverTodayStatus === 'error';

  if (!participation.data || serverToday === null) {
    return <EditResponseLayout onBack={close} isLoading={isLoading} isError={isError} />;
  }

  const candidates = invitation.data?.scheduleCandidateDates ?? [];

  /*
   * 고를 후보가 없으면 그릴 캘린더도 시간표도 없다. 응답이 마감된 모임에서 이렇게 되는데,
   * 서버가 초대 조회에서 후보를 빼고 준다. 어차피 저장도 409(MEETING_PARTICIPATION_CLOSED)로
   * 거절당하므로 빈 화면을 보여주는 대신 이유를 알린다.
   *
   * 현황 화면은 이 경우 수정 버튼을 비활성화한다. 여기까지 오는 건 링크로 곧장 들어온 경우다.
   */
  if (candidates.length === 0) {
    return <EditResponseLayout onBack={close} notice={CLOSED_NOTICE} />;
  }

  if (participation.data.scheduleInputType === 'DATE_AND_TIME') {
    const saved = participation.data.availableTimeRanges;
    const value = edited?.availableTimeRanges ?? saved;

    return (
      <TimeGridEditor
        onBack={close}
        candidates={candidates}
        serverToday={serverToday}
        saved={saved}
        value={value}
        onChange={(availableTimeRanges) => setEdited({ availableTimeRanges })}
        onSave={() => void saveSchedule({ availableTimeRanges: value })}
        isSaving={isSaving}
      />
    );
  }

  const saved = participation.data.availableDates;
  const value = edited?.availableDates ?? saved;

  return (
    <CalendarEditor
      onBack={close}
      candidateDates={candidates.flatMap((candidate) =>
        candidate.candidateDate ? [candidate.candidateDate] : []
      )}
      serverToday={serverToday}
      saved={saved}
      value={value}
      onChange={(availableDates) => setEdited({ availableDates })}
      onSave={() => void saveSchedule({ availableDates: value })}
      isSaving={isSaving}
    />
  );
}

interface EditorProps {
  onBack: () => void;
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 지난 날짜를 막는 기준이다. */
  serverToday: string;
  onSave: () => void;
  isSaving: boolean;
}

function CalendarEditor({
  onBack,
  candidateDates,
  serverToday,
  saved,
  value,
  onChange,
  onSave,
  isSaving,
}: EditorProps & {
  candidateDates: string[];
  saved: string[];
  value: string[];
  onChange: (value: string[]) => void;
}): React.JSX.Element {
  // 후보의 첫 날짜가 속한 달부터 보여준다. 후보가 없으면 캘린더 기본값에 맡긴다.
  const [firstCandidateDate] = candidateDates;
  const initialMonth =
    firstCandidateDate === undefined ? undefined : toLocalDate(firstCandidateDate);

  return (
    <EditResponseLayout
      onBack={onBack}
      title="가능한 날짜를 알려주세요"
      description="모임장이 지정한 범위 안에서만 선택할 수 있어요"
      isSaveDisabled={value.length === 0 || isSameDates(saved, value)}
      isSaving={isSaving}
      onSave={onSave}
    >
      <DraggableCalendar
        className="mx-auto"
        value={parseScheduleCandidateDates(value)}
        onChange={(next) => onChange(formatScheduleCandidateDates(next))}
        // 후보 밖이거나 이미 지난 날. 날짜가 'yyyy-MM-dd'라 사전순 비교로 족하다.
        isDateDisabled={(date) => {
          const isoDate = toIsoDate(date);

          return !candidateDates.includes(isoDate) || isoDate < serverToday;
        }}
        month={initialMonth}
      />
    </EditResponseLayout>
  );
}

function TimeGridEditor({
  onBack,
  candidates,
  serverToday,
  saved,
  value,
  onChange,
  onSave,
  isSaving,
}: EditorProps & {
  candidates: ScheduleCandidateResponse[];
  saved: ScheduleAvailabilityRequest[];
  value: ScheduleAvailabilityRequest[];
  onChange: (value: ScheduleAvailabilityRequest[]) => void;
}): React.JSX.Element {
  const { columns, rows, disabledKeys } = React.useMemo(
    () => buildGuestScheduleTimeGrid(candidates),
    [candidates]
  );

  // 모임장이 연 범위 밖 + 이미 지난 날짜. 둘 다 "고를 수 없는 칸"이라 합쳐서 넘긴다.
  const unselectableKeys = React.useMemo(
    () => new Set([...disabledKeys, ...buildCellKeysBeforeDate(columns, rows, serverToday)]),
    [disabledKeys, columns, rows, serverToday]
  );

  const selectedCellKeys = availabilityTimeRangesToCellKeys(value);

  return (
    <EditResponseLayout
      onBack={onBack}
      title="가능한 시간대를 알려주세요"
      description="모임장이 지정한 범위 안에서만 선택할 수 있어요"
      isScrollLocked
      isSaveDisabled={selectedCellKeys.length === 0 || isSameTimeRanges(saved, value)}
      isSaving={isSaving}
      onSave={onSave}
    >
      <AvailabilityTimeGrid
        columns={columns}
        rows={rows}
        value={selectedCellKeys}
        onChange={(next) => onChange(cellKeysToAvailabilityTimeRanges(next))}
        disabledKeys={unselectableKeys}
        className="min-h-0 flex-1"
      />
    </EditResponseLayout>
  );
}
