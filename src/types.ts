export type RestaurantComment = {
  id: string;
  content: string;
};

export type Restaurant = {
  id: string;
  name: string;
  imageLabel: string;
  address: string;
  locationHint: string;
  walkingTimeMin: number;
  recommendedMenu: string;
  description: string;
  ratingAvg: number;
  upCount: number;
  downCount: number;
  tags: string[];
  createdAt: string;
  comments: RestaurantComment[];
};

export type CreateRestaurantInput = {
  name: string;
  address: string;
  locationHint: string;
  walkingTimeMin: number;
  recommendedMenu: string;
  description: string;
  tags: string[];
};

export type Organization = {
  id: string;
  name: string;
};

export type AuthSession = {
  userId: string;
  nickname: string;
  organizationId: string;
  organizationName: string;
};

export type InviteVerificationResult = {
  success: boolean;
  organization?: Organization;
  message?: string;
};

export type RegisterInput = {
  organization?: Organization;
  nickname: string;
  password: string;
};

export type LoginInput = {
  nickname: string;
  password: string;
};

export type DataSource = 'supabase' | 'mock';

export type RepositoryResult<T> = {
  data: T;
  source: DataSource;
};

export type AccessVerificationResult = {
  success: boolean;
  userId?: string;
  message?: string;
  source: DataSource;
};
