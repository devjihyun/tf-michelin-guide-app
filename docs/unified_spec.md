# 통합 기준안

이 문서는 `IA.md`, `wireframe.md`, `db_schema.md`, `plan.md`, `milestone.md`를 비교한 뒤,
실제 구현 기준으로 통합한 단일 기준안이다.

## 1. 기준 문서 선정 원칙

- 기능 범위와 운영 정책은 `plan.md`를 기준으로 한다.
- 화면 구조와 사용자 흐름은 `IA.md`, `wireframe.md`를 보완 자료로 사용한다.
- 데이터 모델과 API는 `db_schema.md`를 출발점으로 삼되, `plan.md`에 있는 누락 기능을 보완한다.

## 2. 문서 간 불일치와 결정

### 2-1. 화면 경로

불일치:

- `IA.md`: `/intro`, `/home`, `/place/:id`, `/mypage`, `/admin`
- `plan.md`: `/access`, `/restaurants`, `/restaurants/:id`, `/restaurants/new`, `/ranking`, `/admin`

결정:

- 실제 구현 기준 경로는 아래로 통일한다.

```
/access
/restaurants
/restaurants/:id
/mypage
/admin
```

- `/restaurants/new`는 별도 페이지가 아니라 등록 모달 또는 드로어로 우선 구현한다.
- `/ranking`은 `plan.md`에는 있으나 `IA.md`, `wireframe.md`에서 비중이 낮으므로 2순위 기능으로 둔다.

근거:

- `plan.md`가 가장 상세한 MVP 문서이며 API 리소스 구조와도 명칭이 잘 맞는다.
- `wireframe.md`의 등록 흐름은 모달 형태여서 `/restaurants/new`를 고정 라우트로 둘 필요가 낮다.

## 3. MVP 포함 범위

최종 MVP 포함 기능:

- 초대코드 기반 최초 계정 등록
- 계정 로그인
- 로그인 유지 시 바로 접속
- 맛집 리스트 조회
- 검색 및 정렬
- 맛집 상세 조회
- 맛집 등록
- 태그
- 평점
- 추천 / 비추천
- 댓글 작성 / 수정 / 삭제
- 삭제 요청
- 관리자 승인 / 반려 / 삭제 요청 처리
- 마이페이지

MVP 후순위:

- 랭킹
- 추천 영역
- 외부 업체 자동완성 고도화
- 이미지 업로드 확장
- 지도 기반 탐색

근거:

- `plan.md`에 포함된 기능 중 실제 사용자 가치와 운영 필수 기능을 우선 반영했다.
- `wireframe.md`의 "오늘의 추천"은 핵심 업무 흐름 없이도 서비스 운영이 가능하므로 후순위로 둔다.

## 4. 통합 IA

### `/access`

- 인트로 화면 v2
- 계정 로그인
- 최초 계정 등록
- 초대코드 입력
- 회사 / 조직 확인
- 닉네임 + 패스워드 등록

### `/restaurants`

- 헤더
- 검색
- 정렬: `latest | rating | votes`
- 맛집 카드 리스트
- 등록 버튼

### `/restaurants/:id`

- 대표 이미지
- 업체명
- 위치 설명
- 도보 시간
- 태그
- 추천 메뉴
- 한줄 설명
- 평점
- 추천 / 비추천
- 댓글
- 삭제 요청

### `/mypage`

- 프로필
- 포인트 / 칭호
- 내가 등록한 맛집
- 활동 내역

### `/admin`

- 업체 승인 / 반려
- 삭제 요청 처리
- 운영 상태 확인

## 5. 데이터 모델 통합안

최종 1차 구현 테이블:

- `organizations`
- `users`
- `access_codes`
- `restaurants`
- `restaurant_tags`
- `ratings`
- `votes`
- `comments`
- `deletion_requests`
- `point_histories`

### 핵심 결정

- 최초 접속은 초대코드로 회사 / 조직을 확인한 뒤 계정을 등록한다.
- 다음 접속부터는 초대코드를 다시 입력하지 않고 계정 로그인으로 진입한다.
- 로그인 유지 상태라면 `/restaurants`로 바로 진입한다.
- 계정 등록 필드는 1차 기준으로 닉네임과 패스워드만 둔다.
- 닉네임 생성 규칙은 추후 디벨롭 대상으로 둔다.
- 엔티티 명은 `plan.md` 기준인 `restaurants`로 통일한다.
- `db_schema.md`의 `Place`, `PlaceTag`, `PlaceLike`는 각각 `restaurants`, `restaurant_tags`, `votes`로 정리한다.
- 추천 기능은 단순 `like`가 아니라 `up/down` 2값 구조로 통일한다.
- 평점과 추천은 분리한다.
- 댓글과 삭제 요청은 MVP 포함이므로 반드시 스키마에 포함한다.

### restaurants 필드 기준

- `id`
- `name`
- `external_source`
- `external_id`
- `image_url`
- `address`
- `location_hint`
- `walking_time_min`
- `recommended_menu`
- `description`
- `status`
- `created_by`
- `created_at`

추가 규칙:

- `(external_source, external_id)`는 unique
- `status`는 `pending | approved | rejected`

## 6. API 통합안

### 인증

- `POST /api/auth/invite/verify`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### 맛집

- `GET /api/restaurants`
- `GET /api/restaurants/:id`
- `POST /api/restaurants`

### 평점 / 추천

- `POST /api/restaurants/:id/rating`
- `POST /api/restaurants/:id/vote`

### 댓글

- `POST /api/restaurants/:id/comments`
- `PATCH /api/comments/:id`
- `DELETE /api/comments/:id`

### 마이페이지

- `GET /api/users/me`
- `GET /api/users/me/restaurants`
- `GET /api/users/me/activities`

### 삭제 요청

- `POST /api/restaurants/:id/delete-request`

### 관리자

- `PATCH /api/admin/restaurants/:id/approve`
- `PATCH /api/admin/restaurants/:id/reject`
- `PATCH /api/admin/deletion-requests/:id`

## 7. 실제 구현 우선순위

### P0. 서비스 성립 최소 조건

- 초대코드 검증
- 회사 / 조직 확인
- 닉네임 + 패스워드 계정 등록
- 계정 로그인
- 로그인 유지
- DB 기본 테이블 구축
- 맛집 리스트 조회
- 맛집 상세 조회

### P1. 사용자 핵심 참여

- 맛집 등록
- 태그 입력 / 조회
- 평점
- 추천 / 비추천

### P2. 커뮤니티 완성

- 댓글 작성 / 수정 / 삭제
- 마이페이지
- 포인트 적립 이력

### P3. 운영 필수

- 관리자 승인 / 반려
- 삭제 요청
- 삭제 요청 처리

### P4. 후순위 고도화

- 랭킹
- 홈 추천 영역
- 외부 업체 검색 고도화

## 8. 구현 기준 요약

- 라우트와 API 명칭은 `restaurants` 기준으로 통일한다.
- `/access`는 인트로 화면 v2로 구성하며, 로그인과 최초 계정 등록을 함께 제공한다.
- 초대코드는 최초 계정 등록에서만 사용한다.
- 추천 기능은 `like`가 아니라 `vote`로 구현한다.
- 댓글과 삭제 요청은 제외하지 않고 MVP에 포함한다.
- 등록 화면은 우선 모달 기반으로 구현한다.
- 랭킹과 추천 영역은 후순위로 미룬다.
