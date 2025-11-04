// Points and Rewards System Utilities

export type ActionType =
  | 'meeting_join'
  | 'meeting_complete'
  | 'meeting_host'
  | 'post_create'
  | 'comment_create'
  | 'review_write'
  | 'profile_complete'
  | 'daily_checkin'
  | 'referral_signup'
  | 'referral_first_meeting'
  | 'first_meeting'
  | 'social_share'
  | 'gym_review'
  | 'win_match'
  | 'achievement_unlock'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'level_up';

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  transactionType: 'earn' | 'spend' | 'expire' | 'adjustment';
  sourceType: string;
  sourceId?: string;
  description?: string;
  createdAt: string;
}

export interface PointsConfig {
  actionType: ActionType;
  points: number;
  dailyLimit?: number;
  totalLimit?: number;
  description: string;
  enabled: boolean;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  rewardType: 'discount' | 'badge' | 'feature_unlock' | 'gift' | 'voucher';
  stock?: number;
  enabled: boolean;
  imageUrl?: string;
}

/**
 * Default points configuration
 */
export const DEFAULT_POINTS_CONFIG: Record<ActionType, number> = {
  meeting_join: 50,
  meeting_complete: 100,
  meeting_host: 200,
  post_create: 10,
  comment_create: 5,
  review_write: 30,
  profile_complete: 50,
  daily_checkin: 5,
  referral_signup: 100,
  referral_first_meeting: 200,
  first_meeting: 100,
  social_share: 10,
  gym_review: 30,
  win_match: 150,
  achievement_unlock: 50,
  streak_7_days: 100,
  streak_30_days: 500,
  level_up: 200,
};

/**
 * Calculate streak bonus multiplier
 * @param streakDays Number of consecutive days
 * @returns Multiplier (1.0 - 2.0)
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays < 7) return 1.0;
  if (streakDays < 14) return 1.1;
  if (streakDays < 30) return 1.25;
  if (streakDays < 60) return 1.5;
  if (streakDays < 90) return 1.75;
  return 2.0; // 90+ days
}

/**
 * Calculate points to award including bonus multipliers
 * @param basePoints Base points for the action
 * @param streakDays Current streak
 * @param isPremium Whether user is premium
 * @returns Final points to award
 */
export function calculatePointsToAward(
  basePoints: number,
  streakDays: number = 0,
  isPremium: boolean = false
): number {
  let points = basePoints;

  // Apply streak multiplier
  const streakMultiplier = getStreakMultiplier(streakDays);
  points = Math.round(points * streakMultiplier);

  // Premium users get 20% bonus
  if (isPremium) {
    points = Math.round(points * 1.2);
  }

  return points;
}

/**
 * Format points for display
 * @param points Number of points
 * @returns Formatted string (e.g., "1,234 P")
 */
export function formatPoints(points: number): string {
  return `${points.toLocaleString()} P`;
}

/**
 * Calculate required points for next tier/level
 * @param currentLevel Current level (0-based)
 * @returns Points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  // Exponential curve: each level requires more points
  const basePoints = 1000;
  const multiplier = 1.5;
  return Math.round(basePoints * Math.pow(multiplier, currentLevel));
}

/**
 * Calculate user level based on lifetime points
 * @param lifetimePoints Total points earned ever
 * @returns User level
 */
export function calculateUserLevel(lifetimePoints: number): number {
  let level = 0;
  let pointsNeeded = 0;

  while (pointsNeeded <= lifetimePoints) {
    level++;
    pointsNeeded += getPointsForNextLevel(level - 1);
  }

  return Math.max(0, level - 1);
}

/**
 * Calculate progress to next level
 * @param lifetimePoints Total points earned
 * @returns Object with current level, progress, and points needed
 */
export function getLevelProgress(lifetimePoints: number): {
  currentLevel: number;
  pointsInCurrentLevel: number;
  pointsNeededForNext: number;
  progressPercentage: number;
} {
  const currentLevel = calculateUserLevel(lifetimePoints);
  const pointsForCurrentLevel = Array.from({ length: currentLevel }, (_, i) =>
    getPointsForNextLevel(i)
  ).reduce((sum, p) => sum + p, 0);

  const pointsInCurrentLevel = lifetimePoints - pointsForCurrentLevel;
  const pointsNeededForNext = getPointsForNextLevel(currentLevel);
  const progressPercentage = (pointsInCurrentLevel / pointsNeededForNext) * 100;

  return {
    currentLevel,
    pointsInCurrentLevel,
    pointsNeededForNext,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
  };
}

/**
 * Check if user can afford a reward
 * @param userPoints User's current points
 * @param rewardCost Cost of the reward
 * @returns true if user can afford
 */
export function canAffordReward(userPoints: number, rewardCost: number): boolean {
  return userPoints >= rewardCost;
}

/**
 * Calculate discount value
 * @param originalPrice Original price
 * @param discountPercent Discount percentage (0-100)
 * @returns Discounted price
 */
export function calculateDiscount(originalPrice: number, discountPercent: number): number {
  return Math.round(originalPrice * (1 - discountPercent / 100));
}

/**
 * Validate points transaction
 * @param amount Transaction amount
 * @param userPoints Current user points
 * @param transactionType Type of transaction
 * @returns true if valid
 */
export function validatePointsTransaction(
  amount: number,
  userPoints: number,
  transactionType: 'earn' | 'spend' | 'expire' | 'adjustment'
): boolean {
  // Amount must be positive
  if (amount <= 0) return false;

  // For spending, user must have enough points
  if (transactionType === 'spend' && userPoints < amount) return false;

  return true;
}

/**
 * Calculate points expiration date
 * Points expire after 1 year
 * @param earnedDate Date when points were earned
 * @returns Expiration date
 */
export function calculatePointsExpiration(earnedDate: Date): Date {
  const expirationDate = new Date(earnedDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  return expirationDate;
}

/**
 * Get points breakdown by source
 * @param transactions All user transactions
 * @returns Breakdown by source type
 */
export function getPointsBreakdown(
  transactions: PointsTransaction[]
): Record<string, { earned: number; spent: number; count: number }> {
  const breakdown: Record<string, { earned: number; spent: number; count: number }> = {};

  transactions.forEach((transaction) => {
    const source = transaction.sourceType;

    if (!breakdown[source]) {
      breakdown[source] = { earned: 0, spent: 0, count: 0 };
    }

    if (transaction.transactionType === 'earn') {
      breakdown[source].earned += transaction.amount;
    } else if (transaction.transactionType === 'spend') {
      breakdown[source].spent += Math.abs(transaction.amount);
    }

    breakdown[source].count++;
  });

  return breakdown;
}

/**
 * Get recommended rewards based on user points
 * @param userPoints User's current points
 * @param allRewards All available rewards
 * @returns Filtered and sorted rewards
 */
export function getRecommendedRewards(
  userPoints: number,
  allRewards: RewardItem[]
): RewardItem[] {
  return allRewards
    .filter((reward) => reward.enabled && reward.pointsCost <= userPoints * 1.5) // Show slightly out of reach items
    .sort((a, b) => {
      // Prioritize affordable items
      const aAffordable = a.pointsCost <= userPoints;
      const bAffordable = b.pointsCost <= userPoints;

      if (aAffordable && !bAffordable) return -1;
      if (!aAffordable && bAffordable) return 1;

      // Then sort by cost
      return a.pointsCost - b.pointsCost;
    });
}

/**
 * Calculate total points earned in a time period
 * @param transactions All transactions
 * @param startDate Start of period
 * @param endDate End of period
 * @returns Total points earned
 */
export function getPointsInPeriod(
  transactions: PointsTransaction[],
  startDate: Date,
  endDate: Date
): number {
  return transactions
    .filter((t) => {
      const tDate = new Date(t.createdAt);
      return (
        t.transactionType === 'earn' &&
        tDate >= startDate &&
        tDate <= endDate
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
}
