import { restaurants as mockRestaurants } from '../data/mockRestaurants';
import { getSupabaseClient } from '../lib/supabase';
import { CreateRestaurantInput, RepositoryResult, Restaurant } from '../types';

type SupabaseRestaurantRow = {
  id: string;
  name: string;
  image_url: string | null;
  address: string | null;
  location_hint: string | null;
  walking_time_min: number | null;
  recommended_menu: string | null;
  description: string | null;
  created_at: string;
  rating_avg: number | null;
  up_count: number | null;
  down_count: number | null;
  tags: string[] | null;
};

export async function listApprovedRestaurants(): Promise<RepositoryResult<Restaurant[]>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('restaurant_summaries')
      .select(
        `
          id,
          name,
          image_url,
          address,
          location_hint,
          walking_time_min,
          recommended_menu,
          description,
          created_at,
          rating_avg,
          up_count,
          down_count,
          tags
        `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = data as unknown as SupabaseRestaurantRow[];

    return {
      data: rows.map(mapSupabaseRestaurant),
      source: 'supabase',
    };
  } catch {
    return {
      data: [...mockRestaurants],
      source: 'mock',
    };
  }
}

export async function getRestaurantById(id: string): Promise<RepositoryResult<Restaurant | undefined>> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('restaurant_summaries')
      .select(
        `
          id,
          name,
          image_url,
          address,
          location_hint,
          walking_time_min,
          recommended_menu,
          description,
          created_at,
          rating_avg,
          up_count,
          down_count,
          tags
        `,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      data: data ? mapSupabaseRestaurant(data as unknown as SupabaseRestaurantRow) : undefined,
      source: 'supabase',
    };
  } catch {
    return {
      data: copyRestaurant(mockRestaurants.find((restaurant) => restaurant.id === id)),
      source: 'mock',
    };
  }
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<RepositoryResult<Restaurant>> {
  const restaurant: Restaurant = {
    id: `mock-${Date.now()}`,
    name: input.name,
    imageLabel: input.tags[0] ?? '맛집',
    address: input.address,
    locationHint: input.locationHint,
    walkingTimeMin: input.walkingTimeMin,
    recommendedMenu: input.recommendedMenu,
    description: input.description,
    ratingAvg: 0,
    upCount: 0,
    downCount: 0,
    tags: input.tags,
    createdAt: new Date().toISOString(),
    comments: [],
  };

  mockRestaurants.unshift(restaurant);

  return {
    data: copyRestaurant(restaurant)!,
    source: 'mock',
  };
}

export async function updateRestaurantRating(
  id: string,
  score: number,
): Promise<RepositoryResult<Restaurant | undefined>> {
  const restaurant = mockRestaurants.find((item) => item.id === id);

  if (restaurant) {
    restaurant.ratingAvg = score;
  }

  return {
    data: copyRestaurant(restaurant),
    source: 'mock',
  };
}

export async function updateRestaurantVote(
  id: string,
  voteType: 'up' | 'down',
  previousVoteType?: 'up' | 'down',
): Promise<RepositoryResult<Restaurant | undefined>> {
  const restaurant = mockRestaurants.find((item) => item.id === id);

  if (restaurant) {
    if (previousVoteType === 'up') {
      restaurant.upCount = Math.max(0, restaurant.upCount - 1);
    }

    if (previousVoteType === 'down') {
      restaurant.downCount = Math.max(0, restaurant.downCount - 1);
    }

    if (voteType === 'up') {
      restaurant.upCount += 1;
    } else {
      restaurant.downCount += 1;
    }
  }

  return {
    data: copyRestaurant(restaurant),
    source: 'mock',
  };
}

function copyRestaurant(restaurant: Restaurant | undefined): Restaurant | undefined {
  if (!restaurant) {
    return undefined;
  }

  return {
    ...restaurant,
    tags: [...restaurant.tags],
    comments: restaurant.comments.map((comment) => ({ ...comment })),
  };
}

function mapSupabaseRestaurant(restaurant: SupabaseRestaurantRow): Restaurant {
  return {
    id: restaurant.id,
    name: restaurant.name,
    imageLabel: restaurant.image_url ? '이미지' : '맛집',
    address: restaurant.address ?? '',
    locationHint: restaurant.location_hint ?? '',
    walkingTimeMin: restaurant.walking_time_min ?? 0,
    recommendedMenu: restaurant.recommended_menu ?? '',
    description: restaurant.description ?? '',
    ratingAvg: restaurant.rating_avg ?? 0,
    upCount: restaurant.up_count ?? 0,
    downCount: restaurant.down_count ?? 0,
    tags: restaurant.tags ?? [],
    createdAt: restaurant.created_at,
    comments: [],
  };
}
