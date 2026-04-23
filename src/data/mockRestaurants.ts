import { Restaurant } from '../types';

export const restaurants: Restaurant[] = [
  {
    id: 'hongkong-banjeom',
    name: '홍콩반점',
    imageLabel: '짜장면',
    address: '경기 성남시 분당구 판교역로 145',
    locationHint: '아브뉴프랑 2층',
    walkingTimeMin: 5,
    recommendedMenu: '짜장면, 탕수육',
    description: '짧은 점심 시간에 다녀오기 좋고 회전이 빠릅니다.',
    ratingAvg: 4.2,
    upCount: 12,
    downCount: 1,
    tags: ['중식', '자장면', '빠른점심'],
    createdAt: '2026-04-23T08:00:00.000Z',
    comments: [
      {
        id: 'comment-1',
        content: '웨이팅이 있어도 음식이 빨리 나옵니다.',
      },
    ],
  },
  {
    id: 'salad-archive',
    name: '샐러드 아카이브',
    imageLabel: '샐러드',
    address: '경기 성남시 분당구 대왕판교로 660',
    locationHint: '회사 후문 건너편',
    walkingTimeMin: 7,
    recommendedMenu: '닭가슴살 곡물 샐러드',
    description: '가벼운 점심과 커피를 같이 해결하기 좋습니다.',
    ratingAvg: 4.6,
    upCount: 18,
    downCount: 0,
    tags: ['샐러드', '가벼운점심', '커피'],
    createdAt: '2026-04-22T08:00:00.000Z',
    comments: [
      {
        id: 'comment-2',
        content: '가격대는 있지만 양이 충분합니다.',
      },
    ],
  },
  {
    id: 'pangyo-gukbap',
    name: '판교국밥',
    imageLabel: '국밥',
    address: '경기 성남시 분당구 판교역로 230',
    locationHint: '판교역 1번 출구 방향',
    walkingTimeMin: 9,
    recommendedMenu: '돼지국밥',
    description: '비 오는 날 선택지가 필요할 때 안정적인 곳입니다.',
    ratingAvg: 4.0,
    upCount: 9,
    downCount: 2,
    tags: ['한식', '국밥', '혼밥'],
    createdAt: '2026-04-21T08:00:00.000Z',
    comments: [
      {
        id: 'comment-3',
        content: '혼자 가도 부담 없습니다.',
      },
    ],
  },
];
