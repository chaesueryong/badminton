// Match Types
export type MatchType = 'MS' | 'WS' | 'MD' | 'WD' | 'XD';

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  MS: '남자 단식',
  WS: '여자 단식',
  MD: '남자 복식',
  WD: '여자 복식',
  XD: '혼합 복식'
};

export const MATCH_TYPE_DESCRIPTIONS: Record<MatchType, string> = {
  MS: 'Men\'s Singles',
  WS: 'Women\'s Singles',
  MD: 'Men\'s Doubles',
  WD: 'Women\'s Doubles',
  XD: 'Mixed Doubles'
};

// Match Session Status
export type MatchSessionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Match Result
export type MatchResult = 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'TEAM1_WIN' | 'TEAM2_WIN';

// Match Session
export interface MatchSession {
  id: string;
  meeting_id: string | null;
  session_date: string;
  match_type: MatchType;
  entry_fee_points: number;
  entry_fee_feathers: number;
  winner_points: number;
  status: MatchSessionStatus;
  result: MatchResult | null;
  team1_score: number | null;
  team2_score: number | null;
  court_number: number | null;
  location: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

// Match Participant
export interface MatchParticipant {
  id: string;
  match_session_id: string;
  user_id: string;
  team: 1 | 2;
  entry_fee_points_paid: number;
  entry_fee_feathers_paid: number;
  entry_fee_paid_at: string | null;
  entry_fee_refunded: boolean;
  entry_fee_refunded_at: string | null;
  rating_before: number | null;
  rating_after: number | null;
  rating_change: number | null;
  points_earned: number;
  result_confirmed: boolean;
  confirmed_at: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    gender: 'MALE' | 'FEMALE' | null;
  };
}

// Rating History
export interface RatingHistory {
  id: string;
  user_id: string;
  match_session_id: string | null;
  match_type: MatchType;
  rating_before: number;
  rating_after: number;
  rating_change: number;
  is_winner: boolean | null;
  created_at: string;
}

// Match Entry Transaction
export interface MatchEntryTransaction {
  id: string;
  user_id: string;
  match_session_id: string;
  match_participant_id: string;
  transaction_type: 'ENTRY_FEE' | 'REFUND';
  currency_type: 'POINTS' | 'FEATHERS';
  amount: number;
  points_transaction_id: string | null;
  feather_transaction_id: string | null;
  created_at: string;
}

// Match Invitation Status
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

// Match Invitation
export interface MatchInvitation {
  id: string;
  match_session_id: string;
  inviter_id: string;
  invitee_id: string;
  team: 1 | 2;
  status: InvitationStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
}

// Match Invitation with User Details
export interface MatchInvitationDetailed extends MatchInvitation {
  inviter: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  invitee: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  session: MatchSession;
}

// Create Invitation Request
export interface CreateInvitationRequest {
  inviteeId: string;
  team: 1 | 2;
  message?: string;
}

// Respond to Invitation Request
export interface RespondInvitationRequest {
  action: 'accept' | 'decline' | 'cancel';
}

// Match History Entry
export interface MatchHistoryEntry {
  id: string;
  matchType: MatchType;
  status: MatchSessionStatus;
  result: MatchResult | null;
  team: 1 | 2;
  isWinner: boolean;
  score: {
    team1: number | null;
    team2: number | null;
    userTeam: number | null;
    opponentTeam: number | null;
  };
  rating: {
    before: number | null;
    after: number | null;
    change: number | null;
  };
  entryFee: {
    points: number;
    feathers: number;
  };
  pointsEarned: number;
  location: string | null;
  sessionDate: string;
  completedAt: string | null;
  teammates: Array<{
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    ratingBefore: number | null;
    ratingAfter: number | null;
    ratingChange: number | null;
  }>;
  opponents: Array<{
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    ratingBefore: number | null;
    ratingAfter: number | null;
    ratingChange: number | null;
  }>;
}

// Match History Statistics
export interface MatchHistoryStats {
  totalMatches: number;
  completed: number;
  wins: number;
  losses: number;
  totalRatingGained: number;
  totalPointsEarned: number;
}

// Match History Response
export interface MatchHistoryResponse {
  matches: MatchHistoryEntry[];
  stats: MatchHistoryStats;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// User Ratings
export interface UserRatings {
  rating_ms: number;
  rating_ws: number;
  rating_md: number;
  rating_wd: number;
  rating_xd: number;
  peak_rating_ms: number;
  peak_rating_ws: number;
  peak_rating_md: number;
  peak_rating_wd: number;
  peak_rating_xd: number;
  games_ms: number;
  games_ws: number;
  games_md: number;
  games_wd: number;
  games_xd: number;
  wins_ms: number;
  wins_ws: number;
  wins_md: number;
  wins_wd: number;
  wins_xd: number;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  nickname: string;
  profileImage: string | null;
  gender: 'MALE' | 'FEMALE' | null;
  region: string | null;
  level: string;
  rating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  ratings: {
    ms: number;
    ws: number;
    md: number;
    wd: number;
    xd: number;
  };
}

// Match Type Stats
export interface MatchTypeStats {
  matchType: MatchType;
  rating: number;
  peakRating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

// User Rating Profile
export interface UserRatingProfile {
  user: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
    gender: 'MALE' | 'FEMALE' | null;
    region: string | null;
    level: string;
  };
  overall: {
    highestRating: number;
    highestPeakRating: number;
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  };
  byMatchType: MatchTypeStats[];
  recentHistory: RatingHistory[];
  historyByType: Record<string, RatingHistory[]>;
}

// Create Match Session Request
export interface CreateMatchSessionRequest {
  meetingId?: string;
  matchType: MatchType;
  entryFeePoints?: number;
  entryFeeFeathers?: number;
  winnerPoints?: number;
  courtNumber?: number;
  location?: string;
  participants: {
    userId: string;
    team: 1 | 2;
  }[];
}

// Complete Match Request
export interface CompleteMatchRequest {
  result: MatchResult;
  team1Score: number;
  team2Score: number;
}

// Join Match Request
export interface JoinMatchRequest {
  paymentMethod: 'points' | 'feathers';
}

// Rating Tier
export interface RatingTier {
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
  icon: string;
}

export const RATING_TIERS: RatingTier[] = [
  { name: 'Bronze', minRating: 0, maxRating: 1199, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', minRating: 1200, maxRating: 1399, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', minRating: 1400, maxRating: 1599, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', minRating: 1600, maxRating: 1799, color: '#E5E4E2', icon: '💎' },
  { name: 'Diamond', minRating: 1800, maxRating: 1999, color: '#B9F2FF', icon: '💠' },
  { name: 'Master', minRating: 2000, maxRating: 2199, color: '#9D4EDD', icon: '👑' },
  { name: 'Grandmaster', minRating: 2200, maxRating: 9999, color: '#FF006E', icon: '🏆' }
];

// Get rating tier for a given rating
export function getRatingTier(rating: number): RatingTier {
  return RATING_TIERS.find(tier => rating >= tier.minRating && rating <= tier.maxRating) || RATING_TIERS[0];
}

// Calculate win rate
export function calculateWinRate(wins: number, totalGames: number): number {
  if (totalGames === 0) return 0;
  return Math.round((wins / totalGames) * 100 * 10) / 10;
}

// Format rating change
export function formatRatingChange(change: number): string {
  if (change > 0) return `+${change}`;
  return change.toString();
}
