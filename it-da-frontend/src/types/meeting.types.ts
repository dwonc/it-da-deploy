export interface Meeting {
    meetingId: number;
    title: string;
    description: string;
    category: string;
    subcategory: string;
    locationName: string;
    meetingTime: string;
    maxParticipants: number;
    currentParticipants: number;
    expectedCost: number;
    vibe: string;
    imageUrl?: string;
    avgRating?: number;
    organizerId: number;
}

// ✅ 상세 페이지용 확장 타입
export interface MeetingDetail extends Meeting {
    organizerUsername: string;
    organizerProfileImage?: string;
    locationAddress: string;
    latitude: number;
    longitude: number;
    locationType: string;
    timeSlot: string;
    status: string;
    reviewCount: number;
    createdAt: string;
    isFull: boolean;
    dDay: number;
}

// ✅ 리스트 응답 (API 응답 구조)
export interface MeetingListResponse {
    success: boolean;
    message: string;
    meetings: Meeting[];
    totalCount: number;
    currentPage?: number;
    totalPages?: number;
}