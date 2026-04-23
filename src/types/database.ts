export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          point: number;
          title: string | null;
          profile_icon: string | null;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          nickname: string;
          point?: number;
          title?: string | null;
          profile_icon?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      access_codes: {
        Row: {
          id: string;
          code: string;
          status: 'active' | 'expired';
          expired_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: 'active' | 'expired';
          expired_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['access_codes']['Insert']>;
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          external_source: string | null;
          external_id: string | null;
          image_url: string | null;
          address: string | null;
          location_hint: string | null;
          walking_time_min: number | null;
          recommended_menu: string | null;
          description: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          external_source?: string | null;
          external_id?: string | null;
          image_url?: string | null;
          address?: string | null;
          location_hint?: string | null;
          walking_time_min?: number | null;
          recommended_menu?: string | null;
          description?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
      };
      restaurant_tags: {
        Row: {
          id: string;
          restaurant_id: string;
          tag_name: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          tag_name: string;
        };
        Update: Partial<Database['public']['Tables']['restaurant_tags']['Insert']>;
      };
      ratings: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          score: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ratings']['Insert']>;
      };
      votes: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          vote_type: 'up' | 'down';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          vote_type: 'up' | 'down';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['votes']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          restaurant_id: string;
          user_id: string;
          content: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          user_id: string;
          content: string;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      deletion_requests: {
        Row: {
          id: string;
          restaurant_id: string;
          requested_by: string;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          requested_by: string;
          reason: string;
          status?: 'pending' | 'approved' | 'rejected';
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['deletion_requests']['Insert']>;
      };
      point_histories: {
        Row: {
          id: string;
          user_id: string;
          type: 'register' | 'vote_received' | 'selected' | 'admin_adjust';
          amount: number;
          target_restaurant_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'register' | 'vote_received' | 'selected' | 'admin_adjust';
          amount: number;
          target_restaurant_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['point_histories']['Insert']>;
      };
    };
    Views: {
      restaurant_summaries: {
        Row: {
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
          up_count: number;
          down_count: number;
          tags: string[] | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
