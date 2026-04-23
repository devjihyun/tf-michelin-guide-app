```md
# 씽슐랭 가이드 (Thing Michelin Guide) MVP 명세

---

## 1. 프로젝트 개요

### 목적
직원들이 직접 등록하고 평가하는 **회사 근처 검증된 맛집 플랫폼**

### 핵심 컨셉
- 사내 커뮤니티 기반 미쉐린 가이드
- 실제 사용자 경험 기반 추천
- 간단한 참여 + 관리 구조

---

## 2. MVP 범위

### 포함 기능

- 초대코드 기반 최초 계정 등록
- 계정 로그인
- 로그인 유지
- 맛집 등록
- 태그 기반 검색
- 평점 (1~5)
- 추천 / 비추천
- 댓글 (작성 / 수정 / 삭제)
- 랭킹
- 위치 설명 + 도보 시간 (수기 입력)
- 삭제 요청 (사유 입력)
- 관리자 승인 / 삭제

---

### 제외 기능 (2차)

- 지도 기반 탐색
- 이미지 업로드 확장
- AI 추천
- 실시간 알림
- 고급 신고 시스템

---

## 3. 화면 IA

```

/access
/restaurants
/restaurants/:id
/restaurants/new
/ranking
/admin

```

---

### 사용자 흐름

```

[최초 접속: 초대코드 입력]
↓
[회사/조직 확인]
↓
[닉네임 + 패스워드 계정 등록]
↓
[리스트]

또는

[다음 접속: 계정 로그인]
↓
[리스트]
↓
[상세]
↓
[평점 / 댓글 / 추천]

또는

[리스트]
↓
[등록]
↓
[관리자 승인]
↓
[노출]

````

---

## 4. 데이터 구조 (DB Schema)

### organizations

```sql
create table organizations (
  id uuid primary key,
  name varchar(100) not null,
  created_at timestamp default now()
);
````

### users

```sql
create table users (
  id uuid primary key,
  organization_id uuid not null,
  nickname varchar(50) not null,
  password_hash varchar(255) not null,
  role varchar(20) default 'user',
  created_at timestamp default now()
);
````

---

### access_codes

```sql
create table access_codes (
  id uuid primary key,
  organization_id uuid not null,
  code varchar(50) unique not null,
  status varchar(20) default 'active',
  expired_at timestamp,
  used_at timestamp,
  created_at timestamp default now()
);
````

---

### restaurants

```sql
create table restaurants (
  id uuid primary key,
  name varchar(150) not null,
  address varchar(255),
  location_hint varchar(100),
  walking_time_min int,
  is_not_pangyo boolean default false,
  description text,
  status varchar(20) default 'pending',
  is_deleted boolean default false,
  created_by uuid,
  created_at timestamp default now()
);
```

---

### tags

```sql
create table tags (
  id uuid primary key,
  name varchar(50) unique
);
```

---

### restaurant_tags

```sql
create table restaurant_tags (
  id uuid primary key,
  restaurant_id uuid,
  tag_id uuid
);
```

---

### ratings

```sql
create table ratings (
  id uuid primary key,
  restaurant_id uuid,
  user_id uuid,
  score int check (score between 1 and 5),
  unique (restaurant_id, user_id)
);
```

---

### votes

```sql
create table votes (
  id uuid primary key,
  restaurant_id uuid,
  user_id uuid,
  vote_type varchar(10),
  unique (restaurant_id, user_id)
);
```

---

### comments

```sql
create table comments (
  id uuid primary key,
  restaurant_id uuid,
  user_id uuid,
  content text,
  is_deleted boolean default false,
  created_at timestamp default now()
);
```

---

### deletion_requests

```sql
create table deletion_requests (
  id uuid primary key,
  target_type varchar(20),
  target_id uuid,
  requested_by uuid,
  reason text,
  status varchar(20) default 'pending',
  created_at timestamp default now()
);
```

---

## 5. API 명세

### 인증

```
GET /api/auth/session
POST /api/auth/invite/verify
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

---

### 맛집

```
GET /api/restaurants
GET /api/restaurants/:id
POST /api/restaurants
```

---

### 평점 / 추천

```
POST /api/restaurants/:id/rating
POST /api/restaurants/:id/vote
```

---

### 댓글

```
POST /api/restaurants/:id/comments
PATCH /api/comments/:id
DELETE /api/comments/:id
```

---

### 삭제 요청

```
POST /api/restaurants/:id/delete-request
```

---

### 관리자

```
PATCH /api/admin/restaurants/:id/status
PATCH /api/admin/deletion-requests/:id
```

---

## 6. 핵심 기능 상세

### 6-1. 맛집 등록

입력 항목:

* 업체명
* 주소
* 위치 설명 (예: 아브뉴프랑 2층)
* 도보 시간 (숫자, 분)
* 태그
* 설명

---

### 6-2. 거리 방식

* 수기 입력 기반
* 필드 분리

```
location_hint: "아브뉴프랑 2층"
walking_time_min: 10
```

---

### 6-3. 평점

```
평균 = sum(score) / count
```

---

### 6-4. 추천 / 비추천

* 유저당 1개
* up / down

---

### 6-5. 랭킹

```
score = (평점 * 10) + (추천 * 2) - (비추천 * 2)
```

---

## 7. 권한 정책

| 기능    | 권한  |
| ----- | --- |
| 댓글 수정 | 작성자 |
| 댓글 삭제 | 작성자 |
| 업체 삭제 | 관리자 |
| 삭제 요청 | 사용자 |
| 승인    | 관리자 |

---

## 8. 삭제 정책

### 댓글

* soft delete (`is_deleted = true`)

### 업체

* 관리자만 삭제
* 일반 사용자는 삭제 요청

### 삭제 요청

* 사유 필수 입력
* 관리자 승인/거절

---

## 9. UI 구조

### 리스트 카드

```
[업체명]
[태그]
평점 4.5 · 추천 12
아브뉴프랑 2층 · 도보 10분
```

---

### 상세

```
업체명
위치: 아브뉴프랑 2층
도보: 10분

평점
추천 / 비추천

댓글
```

---

### 등록

```
업체명
주소
위치 설명
도보 시간
태그 선택
등록
```

---

## 10. 기술 스택

### 프론트

* React
* Vite
* TypeScript

### 백엔드

* Supabase (권장)

### DB

* PostgreSQL

---

## 11. 개발 일정

### 1주차

* 프로젝트 세팅
* DB 구축
* 인증
* 리스트/상세

---

### 2주차

* 등록
* 평점
* 추천
* 댓글

---

### 3주차

* 삭제 요청
* 관리자 기능
* 랭킹
* QA / 배포

---

## 12. 접근성

### 태그

* button 사용
* 선택 상태 전달
  (WCAG 4.1.2)

---

### 평점

* radio group 구조
  (WCAG 2.1.1)

---

### 댓글

* 상태 메시지 제공
  (WCAG 4.1.3)

---

### 위치 정보

* 지도 없이 텍스트 제공
  (WCAG 1.1.1, 1.3.1)

---

## 13. MVP 완료 기준

* 업체 등록 가능
* 관리자 승인 후 노출
* 리스트 조회 가능
* 태그 필터 가능
* 평점/추천/댓글 동작
* 삭제 요청 기능 동작
* 관리자 처리 가능

---

## 최종 요약

```
사내 사용자 기반 맛집 추천 플랫폼

- 데이터: 내부 DB 중심
- 거리: 수기 입력
- 참여: 평점 / 댓글 / 추천
- 운영: 관리자 승인 구조
```

```
```
