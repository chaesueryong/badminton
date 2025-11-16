import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { findBestMatches, UserProfile } from '@/lib/matching';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const maxEloDifference = parseInt(searchParams.get('maxEloDiff') || '200');
    const preferredRegions = searchParams.get('regions')?.split(',') || [];
    const minGamesPlayed = parseInt(searchParams.get('minGames') || '0');
    const minMatchScore = parseInt(searchParams.get('minScore') || '40');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get current user profile
    const { data: currentUserData, error: userError } = await supabase
      .from('users')
      .select('id, name, nickname, elo_rating, level, region, profile_image, games_played, wins, losses')
      .eq('id', user.id)
      .single();

    if (userError || !currentUserData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const currentUser: UserProfile = {
      id: currentUserData.id,
      name: currentUserData.name,
      nickname: currentUserData.nickname,
      eloRating: currentUserData.elo_rating,
      level: currentUserData.level,
      region: currentUserData.region,
      profileImage: currentUserData.profile_image,
      gamesPlayed: currentUserData.games_played,
      winRate:
        currentUserData.games_played > 0
          ? (currentUserData.wins / currentUserData.games_played) * 100
          : 0,
    };

    // Get potential matches
    // Fetch users with similar ELO and in nearby regions
    const { data: candidates, error: candidatesError } = await supabase
      .from('users')
      .select('id, name, nickname, elo_rating, level, region, profile_image, games_played, wins, losses')
      .neq('id', user.id)
      .gte('elo_rating', currentUser.eloRating - maxEloDifference)
      .lte('elo_rating', currentUser.eloRating + maxEloDifference)
      .gte('games_played', minGamesPlayed)
      .limit(100);

    if (candidatesError) {
      console.error('Error fetching candidates:', candidatesError);
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Convert to UserProfile format
    const candidateProfiles: UserProfile[] = candidates.map((c: any) => ({
      id: c.id,
      name: c.name,
      nickname: c.nickname,
      eloRating: c.elo_rating,
      level: c.level,
      region: c.region,
      profileImage: c.profile_image,
      gamesPlayed: c.games_played,
      winRate: c.games_played > 0 ? (c.wins / c.games_played) * 100 : 0,
    }));

    // Find best matches
    const matches = findBestMatches(
      currentUser,
      candidateProfiles,
      {
        maxEloDifference,
        preferredRegions: preferredRegions.length > 0 ? preferredRegions : undefined,
        minGamesPlayed,
        minMatchScore,
      },
      limit
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Error finding matches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
