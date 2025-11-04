// ELO Rating System Utilities

export interface EloCalculation {
  player1EloAfter: number;
  player2EloAfter: number;
  player1EloChange: number;
  player2EloChange: number;
}

export interface MatchResult {
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  result: 'player1_win' | 'player2_win' | 'draw';
  matchType?: 'casual' | 'ranked' | 'tournament';
  meetingId?: string;
}

/**
 * Calculate ELO rating change
 * @param playerRating Current ELO rating of the player
 * @param opponentRating Current ELO rating of the opponent
 * @param result Result from player's perspective (1 = win, 0.5 = draw, 0 = loss)
 * @param kFactor K-factor determines how much ratings change (default 32)
 * @returns ELO change amount
 */
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: number,
  kFactor: number = 32
): number {
  // Calculate expected score using ELO formula
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  // Calculate ELO change
  const eloChange = Math.round(kFactor * (result - expectedScore));

  return eloChange;
}

/**
 * Calculate new ELO ratings for both players after a match
 * @param player1Rating Current ELO of player 1
 * @param player2Rating Current ELO of player 2
 * @param result Match result
 * @param kFactor K-factor (default 32)
 * @returns New ELO ratings for both players
 */
export function calculateNewEloRatings(
  player1Rating: number,
  player2Rating: number,
  result: 'player1_win' | 'player2_win' | 'draw',
  kFactor: number = 32
): EloCalculation {
  // Convert result to numeric values
  let player1Result: number;
  let player2Result: number;

  switch (result) {
    case 'player1_win':
      player1Result = 1;
      player2Result = 0;
      break;
    case 'player2_win':
      player1Result = 0;
      player2Result = 1;
      break;
    case 'draw':
      player1Result = 0.5;
      player2Result = 0.5;
      break;
  }

  // Calculate ELO changes
  const player1EloChange = calculateEloChange(player1Rating, player2Rating, player1Result, kFactor);
  const player2EloChange = calculateEloChange(player2Rating, player1Rating, player2Result, kFactor);

  // Calculate new ratings
  const player1EloAfter = player1Rating + player1EloChange;
  const player2EloAfter = player2Rating + player2EloChange;

  return {
    player1EloAfter,
    player2EloAfter,
    player1EloChange,
    player2EloChange,
  };
}

/**
 * Get K-factor based on player rating and experience
 * More experienced/higher rated players have lower K-factor (more stable ratings)
 * @param rating Current ELO rating
 * @param gamesPlayed Number of games played
 * @returns K-factor
 */
export function getKFactor(rating: number, gamesPlayed: number): number {
  // New players (< 30 games): Higher K-factor for faster rating adjustment
  if (gamesPlayed < 30) {
    return 40;
  }

  // High-rated players (> 2400): Lower K-factor for stability
  if (rating > 2400) {
    return 16;
  }

  // Professional level (> 2000): Moderate K-factor
  if (rating > 2000) {
    return 24;
  }

  // Default K-factor
  return 32;
}

/**
 * Calculate win probability based on ELO difference
 * @param playerRating Player's ELO rating
 * @param opponentRating Opponent's ELO rating
 * @returns Win probability (0-1)
 */
export function calculateWinProbability(
  playerRating: number,
  opponentRating: number
): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * Get skill level based on ELO rating
 * @param elo ELO rating
 * @returns Skill level (E, D, C, B, A, S)
 */
export function getSkillLevelFromElo(elo: number): string {
  if (elo < 1200) return 'E';
  if (elo < 1400) return 'D';
  if (elo < 1600) return 'C';
  if (elo < 1800) return 'B';
  if (elo < 2000) return 'A';
  return 'S';
}

/**
 * Get ELO range for a skill level
 * @param level Skill level (E, D, C, B, A, S)
 * @returns [min, max] ELO range
 */
export function getEloRangeForLevel(level: string): [number, number] {
  switch (level.toUpperCase()) {
    case 'E':
      return [0, 1199];
    case 'D':
      return [1200, 1399];
    case 'C':
      return [1400, 1599];
    case 'B':
      return [1600, 1799];
    case 'A':
      return [1800, 1999];
    case 'S':
      return [2000, 3000];
    default:
      return [0, 3000];
  }
}

/**
 * Check if two players are in similar skill range for fair matching
 * @param elo1 Player 1 ELO
 * @param elo2 Player 2 ELO
 * @param maxDifference Maximum allowed ELO difference (default 200)
 * @returns true if players are in similar skill range
 */
export function arePlayersMatchable(
  elo1: number,
  elo2: number,
  maxDifference: number = 200
): boolean {
  return Math.abs(elo1 - elo2) <= maxDifference;
}

/**
 * Calculate match quality score (0-100)
 * Higher score means better match
 * @param elo1 Player 1 ELO
 * @param elo2 Player 2 ELO
 * @returns Match quality score (0-100)
 */
export function calculateMatchQuality(elo1: number, elo2: number): number {
  const difference = Math.abs(elo1 - elo2);

  // Perfect match (0-50 difference): 100 points
  if (difference <= 50) return 100;

  // Very good match (50-100): 90-100 points
  if (difference <= 100) return 90 + (10 * (100 - difference) / 50);

  // Good match (100-200): 70-90 points
  if (difference <= 200) return 70 + (20 * (200 - difference) / 100);

  // Fair match (200-400): 40-70 points
  if (difference <= 400) return 40 + (30 * (400 - difference) / 200);

  // Poor match (400+): 0-40 points
  return Math.max(0, 40 - (difference - 400) / 20);
}

/**
 * Estimate new ELO after multiple games
 * Useful for projections and what-if scenarios
 * @param currentElo Current ELO rating
 * @param wins Number of wins
 * @param losses Number of losses
 * @param draws Number of draws
 * @param averageOpponentElo Average opponent ELO
 * @returns Estimated new ELO
 */
export function estimateEloAfterGames(
  currentElo: number,
  wins: number,
  losses: number,
  draws: number,
  averageOpponentElo: number
): number {
  let elo = currentElo;

  // Simulate wins
  for (let i = 0; i < wins; i++) {
    const change = calculateEloChange(elo, averageOpponentElo, 1);
    elo += change;
  }

  // Simulate losses
  for (let i = 0; i < losses; i++) {
    const change = calculateEloChange(elo, averageOpponentElo, 0);
    elo += change;
  }

  // Simulate draws
  for (let i = 0; i < draws; i++) {
    const change = calculateEloChange(elo, averageOpponentElo, 0.5);
    elo += change;
  }

  return Math.round(elo);
}

/**
 * Get percentile rank based on ELO rating
 * Estimates what percentage of players have lower rating
 * Based on normal distribution assumption
 * @param elo ELO rating
 * @param meanElo Average ELO in population (default 1500)
 * @param stdDevElo Standard deviation (default 200)
 * @returns Percentile (0-100)
 */
export function getEloPercentile(
  elo: number,
  meanElo: number = 1500,
  stdDevElo: number = 200
): number {
  // Calculate z-score
  const z = (elo - meanElo) / stdDevElo;

  // Approximate cumulative distribution function
  // Using error function approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  const percentile = z > 0 ? (1 - p) * 100 : p * 100;

  return Math.round(percentile * 10) / 10;
}
