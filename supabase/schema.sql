create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  nickname varchar(50) not null,
  point int not null default 0,
  title varchar(50),
  profile_icon varchar(255),
  role varchar(20) not null default 'user',
  created_at timestamp with time zone not null default now(),
  constraint users_role_check check (role in ('user', 'admin'))
);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) not null unique,
  status varchar(20) not null default 'active',
  expired_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint access_codes_status_check check (status in ('active', 'expired'))
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  external_source varchar(20),
  external_id varchar(100),
  image_url varchar(500),
  address varchar(255),
  location_hint varchar(100),
  walking_time_min int,
  recommended_menu varchar(255),
  description text,
  status varchar(20) not null default 'pending',
  created_by uuid not null references public.users(id),
  created_at timestamp with time zone not null default now(),
  constraint restaurants_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint restaurants_external_unique unique (external_source, external_id)
);

create table if not exists public.restaurant_tags (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  tag_name varchar(50) not null,
  constraint restaurant_tags_unique unique (restaurant_id, tag_name)
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  score int not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ratings_score_check check (score between 1 and 5),
  constraint ratings_unique unique (restaurant_id, user_id)
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  vote_type varchar(10) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint votes_type_check check (vote_type in ('up', 'down')),
  constraint votes_unique unique (restaurant_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  requested_by uuid not null references public.users(id),
  reason text not null,
  status varchar(20) not null default 'pending',
  reviewed_by uuid references public.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint deletion_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);

create table if not exists public.point_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(30) not null,
  amount int not null,
  target_restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint point_histories_type_check check (
    type in ('register', 'vote_received', 'selected', 'admin_adjust')
  )
);

create index if not exists restaurants_status_created_at_idx
  on public.restaurants (status, created_at desc);

create index if not exists restaurant_tags_tag_name_idx
  on public.restaurant_tags (tag_name);

create index if not exists ratings_restaurant_id_idx
  on public.ratings (restaurant_id);

create index if not exists votes_restaurant_id_idx
  on public.votes (restaurant_id);

create index if not exists comments_restaurant_id_created_at_idx
  on public.comments (restaurant_id, created_at desc)
  where is_deleted = false;

create index if not exists deletion_requests_status_created_at_idx
  on public.deletion_requests (status, created_at desc);

create or replace view public.restaurant_summaries as
with rating_summary as (
  select
    restaurant_id,
    coalesce(avg(score), 0)::numeric(2, 1) as rating_avg
  from public.ratings
  group by restaurant_id
),
vote_summary as (
  select
    restaurant_id,
    count(id) filter (where vote_type = 'up')::int as up_count,
    count(id) filter (where vote_type = 'down')::int as down_count
  from public.votes
  group by restaurant_id
),
tag_summary as (
  select
    restaurant_id,
    array_agg(tag_name order by tag_name) as tags
  from public.restaurant_tags
  group by restaurant_id
)
select
  restaurants.id,
  restaurants.name,
  restaurants.image_url,
  restaurants.address,
  restaurants.location_hint,
  restaurants.walking_time_min,
  restaurants.recommended_menu,
  restaurants.description,
  restaurants.created_at,
  coalesce(rating_summary.rating_avg, 0) as rating_avg,
  coalesce(vote_summary.up_count, 0) as up_count,
  coalesce(vote_summary.down_count, 0) as down_count,
  coalesce(tag_summary.tags, array[]::varchar[]) as tags
from public.restaurants
left join rating_summary
  on rating_summary.restaurant_id = restaurants.id
left join vote_summary
  on vote_summary.restaurant_id = restaurants.id
left join tag_summary
  on tag_summary.restaurant_id = restaurants.id
where restaurants.status = 'approved'
;
