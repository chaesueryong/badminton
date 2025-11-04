// Matching Algorithm for Partner/Opponent Matching

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  eloRating: number;
  level: string;
  region: string;
  profileImage?: string;
  gamesPlayed: number;
  winRate?: number;
}

export interface MatchScore {
  user: UserProfile;
  score: number;
  breakdown: {
    eloScore: number;
    regionScore: number;
    activityScore: number;
    availabilityScore: number;
  };
}

/**
 * Calculate matching score between two users
 * @param currentUser The user looking for a match
 * @param candidate Potential match candidate
 * @param preferences User preferences for matching
 * @returns Match score (0-100)
 */
export function calculateMatchScore(
  currentUser: UserProfile,
  candidate: UserProfile,
  preferences?: {
    maxEloDifference?: number;
    preferredRegions?: string[];
    minGamesPlayed?: number;
  }
): MatchScore {
  const weights = {
    elo: 0.4,
    region: 0.3,
    activity: 0.2,
    availability: 0.1,
  };

  // 1. ELO Score (40%)
  const eloDifference = Math.abs(currentUser.eloRating - candidate.eloRating);
  const maxEloDiff = preferences?.maxEloDifference || 200;
  const eloScore = Math.max(0, 100 - (eloDifference / maxEloDiff) * 100);

  // 2. Region Score (30%)
  const regionScore = currentUser.region === candidate.region ? 100 : 50;

  // Bonus for preferred regions
  if (preferences?.preferredRegions?.includes(candidate.region)) {
    // Already handled in regionScore
  }

  // 3. Activity Score (20%)
  // Users with similar activity levels (games played) tend to match better
  const gamesPlayedDiff = Math.abs(currentUser.gamesPlayed - candidate.gamesPlayed);
  const activityScore = Math.max(0, 100 - (gamesPlayedDiff / 50) * 100);

  // 4. Availability Score (10%)
  // For now, this is a placeholder - can be enhanced with actual availability data
  const availabilityScore = 75; // Default score

  // Calculate weighted total
  const totalScore =
    eloScore * weights.elo +
    regionScore * weights.region +
    activityScore * weights.activity +
    availabilityScore * weights.availability;

  return {
    user: candidate,
    score: Math.round(totalScore),
    breakdown: {
      eloScore: Math.round(eloScore),
      regionScore: Math.round(regionScore),
      activityScore: Math.round(activityScore),
      availabilityScore: Math.round(availabilityScore),
    },
  };
}

/**
 * Find best matches for a user
 * @param currentUser The user looking for matches
 * @param candidates Pool of potential matches
 * @param preferences User preferences
 * @param limit Number of matches to return
 * @returns Sorted list of best matches
 */
export function findBestMatches(
  currentUser: UserProfile,
  candidates: UserProfile[],
  preferences?: {
    maxEloDifference?: number;
    preferredRegions?: string[];
    minGamesPlayed?: number;
    minMatchScore?: number;
  },
  limit: number = 10
): MatchScore[] {
  // Filter candidates
  let filtered = candidates.filter((candidate) => {
    // Don't match with self
    if (candidate.id === currentUser.id) return false;

    // Check ELO difference
    if (preferences?.maxEloDifference) {
      const diff = Math.abs(currentUser.eloRating - candidate.eloRating);
      if (diff > preferences.maxEloDifference) return false;
    }

    // Check minimum games played
    if (preferences?.minGamesPlayed) {
      if (candidate.gamesPlayed < preferences.minGamesPlayed) return false;
    }

    return true;
  });

  // Calculate match scores
  const scoredMatches = filtered.map((candidate) =>
    calculateMatchScore(currentUser, candidate, preferences)
  );

  // Filter by minimum score
  let finalMatches = scoredMatches;
  if (preferences?.minMatchScore) {
    finalMatches = scoredMatches.filter((m) => m.score >= preferences.minMatchScore!);
  }

  // Sort by score (descending)
  finalMatches.sort((a, b) => b.score - a.score);

  // Return top matches
  return finalMatches.slice(0, limit);
}

/**
 * Get match quality description
 * @param score Match score (0-100)
 * @returns Quality description
 */
export function getMatchQualityDescription(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: 'Perfect Match',
      color: 'green',
      description: 'Excellent match! Very similar skill level and preferences.',
    };
  } else if (score >= 75) {
    return {
      label: 'Great Match',
      color: 'blue',
      description: 'Great match! Similar skill level and good compatibility.',
    };
  } else if (score >= 60) {
    return {
      label: 'Good Match',
      color: 'yellow',
      description: 'Good match! Should provide a fair and fun game.',
    };
  } else if (score >= 40) {
    return {
      label: 'Fair Match',
      color: 'orange',
      description: 'Fair match. Some differences in skill or preferences.',
    };
  } else {
    return {
      label: 'Poor Match',
      color: 'red',
      description: 'Not recommended. Significant differences in skill level.',
    };
  }
}

/**
 * Calculate compatibility percentage between two users
 * @param user1 First user
 * @param user2 Second user
 * @returns Compatibility percentage (0-100)
 */
export function calculateCompatibility(user1: UserProfile, user2: UserProfile): number {
  const match = calculateMatchScore(user1, user2);
  return match.score;
}

/**
 * Group users into balanced teams
 * @param users List of users to group
 * @param teamSize Size of each team
 * @returns Balanced teams
 */
export function createBalancedTeams(
  users: UserProfile[],
  teamSize: number = 2
): UserProfile[][] {
  if (users.length < teamSize * 2) {
    throw new Error('Not enough users to create balanced teams');
  }

  // Sort users by ELO rating
  const sorted = [...users].sort((a, b) => b.eloRating - a.eloRating);

  const teams: UserProfile[][] = [];
  const numTeams = Math.floor(users.length / teamSize);

  // Use snake draft to balance teams
  // Team 1 gets 1st pick, Team 2 gets 2nd pick, ..., Team N gets Nth pick
  // Then reverse: Team N gets N+1th pick, ..., Team 1 gets 2Nth pick
  for (let i = 0; i < numTeams; i++) {
    teams.push([]);
  }

  let currentTeam = 0;
  let direction = 1;

  for (const user of sorted) {
    teams[currentTeam].push(user);

    if (teams[currentTeam].length < teamSize) {
      currentTeam += direction;

      if (currentTeam >= numTeams) {
        currentTeam = numTeams - 1;
        direction = -1;
      } else if (currentTeam < 0) {
        currentTeam = 0;
        direction = 1;
      }
    } else {
      // Move to next team
      currentTeam += direction;
      if (currentTeam >= numTeams || currentTeam < 0) {
        break;
      }
    }
  }

  // Filter out incomplete teams
  return teams.filter((team) => team.length === teamSize);
}

/**
 * Calculate team average ELO
 * @param team Team members
 * @returns Average ELO rating
 */
export function getTeamAverageElo(team: UserProfile[]): number {
  const total = team.reduce((sum, user) => sum + user.eloRating, 0);
  return Math.round(total / team.length);
}

/**
 * Predict match outcome probability
 * @param team1 First team
 * @param team2 Second team
 * @returns Probability of team1 winning (0-1)
 */
export function predictMatchOutcome(team1: UserProfile[], team2: UserProfile[]): number {
  const team1Elo = getTeamAverageElo(team1);
  const team2Elo = getTeamAverageElo(team2);

  // Use ELO expected score formula
  const probability = 1 / (1 + Math.pow(10, (team2Elo - team1Elo) / 400));

  return probability;
}
