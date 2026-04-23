# tf-michelin-guide-app
회사 전용 신뢰 기반 맛집 추천 플랫폼

## 개발

```bash
npm install
npm run dev
```

## 환경변수

`.env.example`을 기준으로 `.env`를 생성한다.

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

환경변수가 없으면 앱은 mock 데이터를 사용한다.

## Supabase

DB 스키마는 `supabase/schema.sql`에 있다.
Supabase SQL Editor에서 실행해 1차 테이블을 생성한다.
