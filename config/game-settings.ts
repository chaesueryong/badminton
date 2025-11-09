// 게임 설정 - 모든 게임 관련 비용과 보상을 중앙에서 관리

export const GameSettings = {
  // 메시징 비용
  messaging: {
    points: 10,  // 메시지 전송 시 차감되는 포인트
    feathers: 5, // 메시지 전송 시 차감되는 깃털
  },

  // 승자 보너스 포인트
  match: {
    winnerPoints: 100, // 매치 승리 시 지급되는 포인트
  },

  // 세션 생성 비용
  sessionCreation: {
    points: 50,   // 세션 생성 시 차감되는 포인트
    feathers: 25, // 세션 생성 시 차감되는 깃털
  },

  // 세션 참가비 (입장료)
  sessionEntry: {
    points: 20,   // 세션 참가 시 차감되는 포인트
    feathers: 10, // 세션 참가 시 차감되는 깃털
  },

  // 출석 보상
  attendance: {
    daily: 10,              // 일일 출석 기본 포인트
    milestone100Days: 100,  // 100일 단위 마일스톤 보너스
  },

  // 추천인 보상
  referral: {
    signup: 100,  // 친구 초대 성공 시 추천인에게 지급되는 포인트
  },

  // 베팅 기본값
  betting: {
    defaultAmount: 100,  // 매치 생성 시 베팅 금액 초기값
  },

  // 제한 값
  limits: {
    meeting: {
      minParticipants: 2,              // 모임 최소 참가자 수
      maxParticipantsRegular: 50,      // 일반 회원 모임 최대 참가자 수
      maxParticipantsPremium: 300,     // 프리미엄 회원 모임 최대 참가자 수
    },
  },
} as const;

// 타입 안전성을 위한 타입 export
export type GameSettingsType = typeof GameSettings;
