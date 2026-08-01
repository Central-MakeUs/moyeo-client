'use client';

import { useParams } from 'next/navigation';

export default function MeetingOverviewPage() {
  const { meetingId } = useParams<{ meetingId: string }>();

  return <main>{meetingId}</main>;
}
