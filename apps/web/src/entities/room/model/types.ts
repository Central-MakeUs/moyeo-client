export type RoomStatus = 'open' | 'closed';

export type Room = {
  id: string;
  name: string;
  status: RoomStatus;
  memberCount: number;
  meetingDate: string;
};

export type RoomDraft = Pick<Room, 'name' | 'memberCount'>;
