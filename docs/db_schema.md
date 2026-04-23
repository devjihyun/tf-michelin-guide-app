# DB Schema & API Draft

이 문서는 [unified_spec.md](/c:/Users/jihyun.kim/toy/docs/unified_spec.md) 기준으로 정리한 실제 구현용 DB/API 초안이다.

## 1. 테이블

### organizations

회사 / 조직 정보를 관리한다.

```sql
create table organizations (
  id uuid primary key,
  name varchar(100) not null,
  created_at timestamp not null default now()
);
```

### users

사용자 계정 정보와 권한을 관리한다.

```sql
create table users (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  nickname varchar(50) not null,
  password_hash varchar(255) not null,
  point int not null default 0,
  title varchar(50),
  profile_icon varchar(255),
  role varchar(20) not null default 'user',
  created_at timestamp not null default now(),
  constraint users_organization_nickname_unique unique (organization_id, nickname),
  constraint users_role_check check (role in ('user', 'admin'))
);
```

### access_codes

최초 계정 등록용 초대코드를 관리한다. 초대코드는 회사 / 조직 확인과 계정 등록에만 사용한다.

```sql
create table access_codes (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  code varchar(50) not null unique,
  status varchar(20) not null default 'active',
  expired_at timestamp,
  used_at timestamp,
  created_at timestamp not null default now(),
  constraint access_codes_status_check check (status in ('active', 'expired'))
);
```

### restaurants

맛집의 기본 정보와 승인 상태를 관리한다.

```sql
create table restaurants (
  id uuid primary key,
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
  created_by uuid not null references users(id),
  created_at timestamp not null default now(),
  constraint restaurants_status_check check (status in ('pending', 'approved', 'rejected')),
  constraint restaurants_external_unique unique (external_source, external_id)
);
```

### restaurant_tags

맛집별 태그를 관리한다. 별도 `tags` 마스터 테이블은 MVP 이후 분리 가능하다.

```sql
create table restaurant_tags (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  tag_name varchar(50) not null,
  constraint restaurant_tags_unique unique (restaurant_id, tag_name)
);
```

### ratings

사용자별 맛집 평점을 관리한다.

```sql
create table ratings (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score int not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  constraint ratings_score_check check (score between 1 and 5),
  constraint ratings_unique unique (restaurant_id, user_id)
);
```

### votes

사용자별 추천 / 비추천을 관리한다.

```sql
create table votes (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  vote_type varchar(10) not null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  constraint votes_type_check check (vote_type in ('up', 'down')),
  constraint votes_unique unique (restaurant_id, user_id)
);
```

### comments

맛집 상세 댓글을 관리한다. 삭제는 soft delete로 처리한다.

```sql
create table comments (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  is_deleted boolean not null default false,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);
```

### deletion_requests

사용자의 맛집 삭제 요청과 관리자 처리 상태를 관리한다.

```sql
create table deletion_requests (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  requested_by uuid not null references users(id),
  reason text not null,
  status varchar(20) not null default 'pending',
  reviewed_by uuid references users(id),
  reviewed_at timestamp,
  created_at timestamp not null default now(),
  constraint deletion_requests_status_check check (status in ('pending', 'approved', 'rejected'))
);
```

### point_histories

포인트 적립 / 차감 이력을 관리한다.

```sql
create table point_histories (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  type varchar(30) not null,
  amount int not null,
  target_restaurant_id uuid references restaurants(id) on delete set null,
  created_at timestamp not null default now(),
  constraint point_histories_type_check check (type in ('register', 'vote_received', 'selected', 'admin_adjust'))
);
```

## 2. 조회 집계 기준

`restaurants` 테이블에는 `rating_avg`, `vote_count` 같은 집계 값을 기본 컬럼으로 두지 않는다.
리스트와 상세 응답에서 `ratings`, `votes`, `comments`를 기준으로 계산한다.

필요 시 후속 단계에서 view 또는 materialized view로 분리한다.

### 평점

```sql
avg(ratings.score)
```

### 추천 점수

```sql
up_count - down_count
```

### 랭킹 점수

후순위 기능 기준:

```sql
(rating_avg * 10) + (up_count * 2) - (down_count * 2)
```

## 3. API

### 3-1. 세션 확인

```http
GET /api/auth/session
```

Response:

```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "nickname": "식신",
    "organizationId": "uuid"
  }
}
```

규칙:

- 로그인 유지 상태면 `/restaurants`로 바로 진입한다.
- 세션이 없으면 `/access`에서 계정 로그인 화면을 보여준다.

### 3-2. 초대코드 확인

```http
POST /api/auth/invite/verify
```

Request:

```json
{
  "code": "ABC123"
}
```

Response:

```json
{
  "success": true,
  "organization": {
    "id": "uuid",
    "name": "TF / 판교"
  }
}
```

규칙:

- 초대코드는 최초 계정 등록 시 회사 / 조직 확인에만 사용한다.
- 계정 등록 후 다음 접속부터는 초대코드를 다시 입력하지 않는다.
- 만료되었거나 비활성화된 초대코드는 실패 처리한다.

### 3-3. 계정 등록

```http
POST /api/auth/register
```

Request:

```json
{
  "inviteCode": "ABC123",
  "nickname": "식신",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "userId": "uuid"
}
```

규칙:

- 1차 계정 등록 필드는 닉네임과 패스워드만 사용한다.
- 닉네임 생성 규칙은 추후 디벨롭한다.
- 패스워드는 평문 저장하지 않고 `password_hash`로 저장한다.
- 등록 성공 시 로그인 세션을 생성한다.

### 3-4. 계정 로그인

```http
POST /api/auth/login
```

Request:

```json
{
  "nickname": "식신",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "userId": "uuid"
}
```

규칙:

- 로그아웃 상태의 기존 사용자는 계정 로그인만 수행한다.
- 초대코드는 재입력하지 않는다.

### 3-5. 로그아웃

```http
POST /api/auth/logout
```

### 3-6. 맛집 리스트

```http
GET /api/restaurants
```

Query:

```txt
keyword=중식
sort=latest | rating | votes
```

Response:

```json
[
  {
    "id": "uuid",
    "name": "홍콩반점",
    "imageUrl": "...",
    "locationHint": "아브뉴프랑 2층",
    "walkingTimeMin": 5,
    "ratingAvg": 4.2,
    "upCount": 12,
    "downCount": 1,
    "tags": ["중식", "자장면"]
  }
]
```

규칙:

- `status = approved`인 맛집만 노출한다.
- `keyword`는 업체명, 태그, 설명 검색에 사용한다.

### 3-7. 맛집 상세

```http
GET /api/restaurants/:id
```

Response:

```json
{
  "id": "uuid",
  "name": "홍콩반점",
  "imageUrl": "...",
  "address": "경기 성남시 ...",
  "locationHint": "아브뉴프랑 2층",
  "walkingTimeMin": 5,
  "recommendedMenu": "짜장면",
  "description": "가성비 좋음",
  "ratingAvg": 4.2,
  "upCount": 12,
  "downCount": 1,
  "tags": ["중식", "자장면"],
  "comments": []
}
```

### 3-8. 맛집 등록

```http
POST /api/restaurants
```

Request:

```json
{
  "name": "홍콩반점",
  "externalSource": "NAVER",
  "externalId": "123456",
  "imageUrl": "...",
  "address": "경기 성남시 ...",
  "locationHint": "아브뉴프랑 2층",
  "walkingTimeMin": 5,
  "recommendedMenu": "짜장면",
  "description": "가성비 좋음",
  "tags": ["중식", "자장면"]
}
```

Response:

```json
{
  "id": "uuid",
  "status": "pending"
}
```

규칙:

- 등록 직후 기본 상태는 `pending`이다.
- 관리자가 승인하기 전까지 리스트에 노출하지 않는다.

### 3-9. 평점 등록 / 수정

```http
POST /api/restaurants/:id/rating
```

Request:

```json
{
  "score": 4
}
```

규칙:

- `score`는 1부터 5까지 허용한다.
- 같은 사용자는 같은 맛집에 평점 1개만 가진다.
- 이미 평점이 있으면 수정한다.

### 3-10. 추천 / 비추천 등록

```http
POST /api/restaurants/:id/vote
```

Request:

```json
{
  "voteType": "up"
}
```

규칙:

- `voteType`은 `up | down`만 허용한다.
- 같은 사용자는 같은 맛집에 vote 1개만 가진다.
- 이미 vote가 있으면 수정한다.

### 3-11. 댓글

```http
POST /api/restaurants/:id/comments
PATCH /api/comments/:id
DELETE /api/comments/:id
```

Create Request:

```json
{
  "content": "점심에 가기 좋음"
}
```

규칙:

- 댓글 수정 / 삭제는 작성자만 가능하다.
- 삭제는 `is_deleted = true`로 처리한다.

### 3-12. 마이페이지

```http
GET /api/users/me
GET /api/users/me/restaurants
GET /api/users/me/activities
```

### 3-13. 삭제 요청

```http
POST /api/restaurants/:id/delete-request
```

Request:

```json
{
  "reason": "폐업한 매장입니다."
}
```

규칙:

- `reason`은 필수다.
- 삭제 요청 생성 직후 상태는 `pending`이다.

### 3-14. 관리자

```http
PATCH /api/admin/restaurants/:id/approve
PATCH /api/admin/restaurants/:id/reject
PATCH /api/admin/deletion-requests/:id
```

Deletion Request 처리 Request:

```json
{
  "status": "approved"
}
```

규칙:

- 관리자 API는 `role = admin` 사용자만 호출할 수 있다.
- 맛집 승인 시 `restaurants.status = approved`로 변경한다.
- 맛집 반려 시 `restaurants.status = rejected`로 변경한다.
