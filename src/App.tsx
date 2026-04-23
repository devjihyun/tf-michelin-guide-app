import { FormEvent, useEffect, useMemo, useState } from 'react';
import './App.css';
import { getAuthSession, login, logout, registerAccount, verifyInviteCode } from './repositories/authRepository';
import {
  createRestaurant,
  getRestaurantById,
  listApprovedRestaurants,
  updateRestaurantRating,
  updateRestaurantVote,
} from './repositories/restaurantsRepository';
import { AuthSession, CreateRestaurantInput, DataSource, Organization, Restaurant } from './types';

type Route =
  | { name: 'access' }
  | { name: 'restaurants' }
  | { name: 'restaurantDetail'; id: string };

function getRoute(pathname: string): Route {
  const detailMatch = pathname.match(/^\/restaurants\/([^/]+)$/);

  if (detailMatch) {
    return { name: 'restaurantDetail', id: detailMatch[1] };
  }

  if (pathname === '/restaurants') {
    return { name: 'restaurants' };
  }

  return { name: 'access' };
}

function navigate(pathname: string) {
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function App() {
  const [route, setRoute] = useState<Route>(() => getRoute(window.location.pathname));
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    getAuthSession().then((storedSession) => {
      setSession(storedSession);
      setIsAuthReady(true);

      if (storedSession && window.location.pathname === '/access') {
        navigate('/restaurants');
      }

      if (!storedSession && window.location.pathname !== '/access') {
        navigate('/access');
      }
    });
  }, []);

  const handleAuthenticated = (nextSession: AuthSession) => {
    setSession(nextSession);
    navigate('/restaurants');
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    navigate('/access');
  };

  if (!isAuthReady) {
    return (
      <main className="access-page">
        <section className="access-card">
          <p className="eyebrow">TF MICHELIN GUIDE</p>
          <h1>세션 확인 중</h1>
        </section>
      </main>
    );
  }

  if (!session && route.name !== 'access') {
    return null;
  }

  if (route.name === 'restaurants') {
    return <RestaurantsPage session={session} onLogout={handleLogout} />;
  }

  if (route.name === 'restaurantDetail') {
    return <RestaurantDetailPage id={route.id} />;
  }

  return <AccessPage onAuthenticated={handleAuthenticated} />;
}

function AccessPage({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginNickname, setLoginNickname] = useState('TF식신');
  const [loginPassword, setLoginPassword] = useState('password');
  const [inviteCode, setInviteCode] = useState('');
  const [organization, setOrganization] = useState<Organization>();
  const [registerNickname, setRegisterNickname] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [message, setMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(undefined);

    try {
      const session = await login({
        nickname: loginNickname,
        password: loginPassword,
      });
      onAuthenticated(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그인에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  const handleVerifyInvite = async () => {
    setMessage(undefined);
    const result = await verifyInviteCode(inviteCode);

    if (!result.success) {
      setOrganization(undefined);
      setMessage(result.message);
      return;
    }

    setOrganization(result.organization);
    setMessage(result.message);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(undefined);

    try {
      const session = await registerAccount({
        organization,
        nickname: registerNickname,
        password: registerPassword,
      });
      onAuthenticated(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '계정 등록에 실패했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="access-page">
      <section className="intro-poster" aria-labelledby="access-title">
        <span className="year-shape year-shape-top" aria-hidden="true">
          2026
        </span>
        <span className="year-shape year-shape-bottom" aria-hidden="true">
          2026
        </span>

        <div className="intro-logo-placeholder" aria-label="로고 영역" />

        <div className="intro-title">
          <p>씽슐랭 가이드</p>
          <span>TF</span>
          <h1 id="access-title">MICHELIN</h1>
          <strong>GUIDE</strong>
        </div>

        <div className="intro-location">
          <span>판교</span>
          <i aria-hidden="true" />
          <span>PANGYO</span>
        </div>

        <div className="access-tabs" role="tablist" aria-label="접속 방식">
          <button className={mode === 'login' ? 'is-selected' : undefined} type="button" onClick={() => setMode('login')}>
            계정 로그인
          </button>
          <button
            className={mode === 'register' ? 'is-selected' : undefined}
            type="button"
            onClick={() => setMode('register')}
          >
            계정 등록
          </button>
        </div>

        {mode === 'login' ? (
          <form className="access-form" onSubmit={handleLogin}>
            <label htmlFor="login-nickname">닉네임</label>
            <input
              id="login-nickname"
              value={loginNickname}
              onChange={(event) => setLoginNickname(event.target.value)}
              placeholder="TF식신"
              autoComplete="username"
            />
            <label htmlFor="login-password">패스워드</label>
            <input
              id="login-password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder="password"
              type="password"
              autoComplete="current-password"
            />
            {message ? <p className="form-message">{message}</p> : null}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '확인 중' : '로그인'}
            </button>
          </form>
        ) : (
          <form className="access-form" onSubmit={handleRegister}>
            <label htmlFor="invite-code">초대코드</label>
            <div className="invite-row">
              <input
                id="invite-code"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder="ABC123"
                autoComplete="one-time-code"
              />
              <button type="button" onClick={handleVerifyInvite}>
                회사/조직 확인
              </button>
            </div>
            {organization ? <p className="organization-pill">확인 결과: {organization.name}</p> : null}
            <label htmlFor="register-nickname">닉네임</label>
            <input
              id="register-nickname"
              value={registerNickname}
              onChange={(event) => setRegisterNickname(event.target.value)}
              placeholder="닉네임"
              autoComplete="username"
            />
            <label htmlFor="register-password">패스워드</label>
            <input
              id="register-password"
              value={registerPassword}
              onChange={(event) => setRegisterPassword(event.target.value)}
              placeholder="패스워드"
              type="password"
              autoComplete="new-password"
            />
            <p className="help-copy">닉네임 생성 규칙은 추후 디벨롭 예정입니다.</p>
            {message ? <p className="form-message">{message}</p> : null}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중' : '계정 등록'}
            </button>
          </form>
        )}

        <div className="michelin-placeholder" aria-label="하단 이미지/아이콘 영역">
          <span className="icon-placeholder" />
          <span className="wordmark-placeholder">MICHELIN</span>
        </div>
      </section>
    </main>
  );
}

function RestaurantsPage({ session, onLogout }: { session: AuthSession | null; onLogout: () => void }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dataSource, setDataSource] = useState<DataSource>();
  const [notice] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'latest' | 'rating' | 'votes'>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listApprovedRestaurants().then((result) => {
      if (!isMounted) {
        return;
      }

      setRestaurants(result.data);
      setDataSource(result.source);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const filtered = restaurants.filter((restaurant) => {
      if (!normalizedKeyword) {
        return true;
      }

      const searchableText = [
        restaurant.name,
        restaurant.locationHint,
        restaurant.description,
        restaurant.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedKeyword);
    });

    return [...filtered].sort((left, right) => {
      if (sort === 'rating') {
        return right.ratingAvg - left.ratingAvg;
      }

      if (sort === 'votes') {
        return right.upCount - right.downCount - (left.upCount - left.downCount);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [keyword, restaurants, sort]);

  const handleCreateRestaurant = async (input: CreateRestaurantInput) => {
    await createRestaurant(input);
    const result = await listApprovedRestaurants();
    setRestaurants(result.data);
    setDataSource(result.source);
    setIsRegisterOpen(false);
  };

  return (
    <main className="page-shell">
      <header className="top-bar">
        <button className="brand-button" type="button" onClick={() => navigate('/restaurants')}>
          씽슐랭
        </button>
        <div className="user-menu">
          <span>{session?.nickname ?? '게스트'}</span>
          <button className="ghost-button" type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <section className="list-hero">
        <p className="eyebrow">APPROVED RESTAURANTS</p>
        <h1>오늘 점심의 근거</h1>
        <p>승인된 맛집만 모아 보고, 태그와 평가 기준으로 빠르게 고릅니다.</p>
        {dataSource === 'mock' || notice ? (
          <div className="notice-stack">
            {notice ? <p className="data-notice">{notice}</p> : null}
            {dataSource === 'mock' ? <p className="data-notice">현재 mock 데이터를 표시 중입니다.</p> : null}
          </div>
        ) : null}
      </section>

      <section className="toolbar" aria-label="맛집 검색 및 정렬">
        <label className="search-field">
          <span>검색</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="업체명, 태그, 설명"
          />
        </label>

        <label className="sort-field">
          <span>정렬</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="latest">최신순</option>
            <option value="rating">평점순</option>
            <option value="votes">추천순</option>
          </select>
        </label>
      </section>

      <section className="restaurant-grid" aria-label="맛집 리스트">
        {isLoading ? <p className="loading-copy">맛집을 불러오는 중입니다.</p> : null}
        {!isLoading && filteredRestaurants.length === 0 ? (
          <p className="loading-copy">조건에 맞는 맛집이 없습니다.</p>
        ) : null}
        {filteredRestaurants.map((restaurant) => (
          <article className="restaurant-card" key={restaurant.id}>
            <button type="button" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
              <span className="image-placeholder">{restaurant.imageLabel}</span>
              <span className="card-content">
                <strong>{restaurant.name}</strong>
                <span>
                  {restaurant.locationHint} · 도보 {restaurant.walkingTimeMin}분
                </span>
                <span>
                  평점 {restaurant.ratingAvg.toFixed(1)} · 추천 {restaurant.upCount} / 비추천{' '}
                  {restaurant.downCount}
                </span>
                <span className="tag-row">{restaurant.tags.map((tag) => `#${tag}`).join(' ')}</span>
              </span>
            </button>
          </article>
        ))}
      </section>

      <button className="fab" type="button" aria-label="맛집 등록" onClick={() => setIsRegisterOpen(true)}>
        +
      </button>

      {isRegisterOpen ? (
        <RegisterModal onClose={() => setIsRegisterOpen(false)} onSubmit={handleCreateRestaurant} />
      ) : null}
    </main>
  );
}

function RestaurantDetailPage({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<Restaurant | undefined>();
  const [dataSource, setDataSource] = useState<DataSource>();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number>();
  const [selectedVote, setSelectedVote] = useState<'up' | 'down'>();

  useEffect(() => {
    let isMounted = true;

    getRestaurantById(id).then((result) => {
      if (!isMounted) {
        return;
      }

      setRestaurant(result.data);
      setDataSource(result.source);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <main className="page-shell">
        <button className="back-button" type="button" onClick={() => navigate('/restaurants')}>
          ← 리스트로
        </button>
        <section className="empty-state">
          <h1>맛집을 불러오는 중입니다</h1>
        </section>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="page-shell">
        <button className="back-button" type="button" onClick={() => navigate('/restaurants')}>
          ← 리스트로
        </button>
        <section className="empty-state">
          <h1>맛집을 찾을 수 없습니다</h1>
          <p>목록에서 다시 선택해주세요.</p>
        </section>
      </main>
    );
  }

  const handleRating = async (score: number) => {
    const result = await updateRestaurantRating(restaurant.id, score);
    setSelectedRating(score);

    if (result.data) {
      setRestaurant(result.data);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (selectedVote === voteType) {
      return;
    }

    const result = await updateRestaurantVote(restaurant.id, voteType, selectedVote);
    setSelectedVote(voteType);

    if (result.data) {
      setRestaurant(result.data);
    }
  };

  return (
    <main className="page-shell detail-shell">
      <button className="back-button" type="button" onClick={() => navigate('/restaurants')}>
        ← 리스트로
      </button>

      <section className="detail-hero">
        <span className="detail-image">{restaurant.imageLabel}</span>
        <div>
          <p className="eyebrow">APPROVED</p>
          <h1>{restaurant.name}</h1>
          {dataSource === 'mock' ? <p className="data-notice inline">현재 mock 데이터를 표시 중입니다.</p> : null}
          <p>{restaurant.address}</p>
          <p>
            위치: {restaurant.locationHint} · 도보 {restaurant.walkingTimeMin}분
          </p>
          <p className="tag-row">{restaurant.tags.map((tag) => `#${tag}`).join(' ')}</p>
        </div>
      </section>

      <section className="detail-grid">
        <article>
          <h2>추천 메뉴</h2>
          <p>{restaurant.recommendedMenu}</p>
        </article>
        <article>
          <h2>한줄 설명</h2>
          <p>{restaurant.description}</p>
        </article>
        <article>
          <h2>평점</h2>
          <p>{restaurant.ratingAvg.toFixed(1)} / 5.0</p>
          <div className="rating-row" aria-label="평점 선택 예시">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                className={selectedRating === score ? 'is-selected' : undefined}
                key={score}
                type="button"
                onClick={() => handleRating(score)}
              >
                {score}
              </button>
            ))}
          </div>
        </article>
        <article>
          <h2>추천 / 비추천</h2>
          <p>
            추천 {restaurant.upCount} · 비추천 {restaurant.downCount}
          </p>
          <div className="action-row">
            <button
              className={selectedVote === 'up' ? 'is-selected' : undefined}
              type="button"
              onClick={() => handleVote('up')}
            >
              추천
            </button>
            <button
              className={selectedVote === 'down' ? 'is-selected' : undefined}
              type="button"
              onClick={() => handleVote('down')}
            >
              비추천
            </button>
          </div>
        </article>
      </section>

      <section className="comment-panel" aria-labelledby="comments-title">
        <h2 id="comments-title">댓글</h2>
        {restaurant.comments.map((comment) => (
          <p className="comment" key={comment.id}>
            {comment.content}
          </p>
        ))}
        <label>
          <span>댓글 입력</span>
          <textarea placeholder="방문 경험을 남겨주세요" />
        </label>
        <button type="button">작성</button>
      </section>

      <button className="delete-request-button" type="button">
        삭제 요청
      </button>
    </main>
  );
}

function RegisterModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreateRestaurantInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locationHint, setLocationHint] = useState('');
  const [walkingTimeMin, setWalkingTimeMin] = useState('5');
  const [recommendedMenu, setRecommendedMenu] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    const parsedWalkingTime = Number(walkingTimeMin);
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!name.trim() || !locationHint.trim() || Number.isNaN(parsedWalkingTime)) {
      setError('업체명, 위치 설명, 도보 시간을 확인해주세요.');
      return;
    }

    setIsSubmitting(true);
    await onSubmit({
      name: name.trim(),
      address: address.trim(),
      locationHint: locationHint.trim(),
      walkingTimeMin: parsedWalkingTime,
      recommendedMenu: recommendedMenu.trim(),
      description: description.trim(),
      tags: parsedTags,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="register-modal" aria-labelledby="register-title" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="eyebrow">MOCK REGISTER</p>
            <h2 id="register-title">맛집 등록</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            <span>업체명</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="홍콩반점" />
          </label>
          <label>
            <span>주소</span>
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="경기 성남시 ..." />
          </label>
          <label>
            <span>위치 설명</span>
            <input
              value={locationHint}
              onChange={(event) => setLocationHint(event.target.value)}
              placeholder="아브뉴프랑 2층"
            />
          </label>
          <label>
            <span>도보 시간</span>
            <input
              value={walkingTimeMin}
              onChange={(event) => setWalkingTimeMin(event.target.value)}
              inputMode="numeric"
              placeholder="5"
            />
          </label>
          <label>
            <span>추천 메뉴</span>
            <input
              value={recommendedMenu}
              onChange={(event) => setRecommendedMenu(event.target.value)}
              placeholder="짜장면"
            />
          </label>
          <label>
            <span>태그</span>
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="중식, 자장면" />
          </label>
          <label>
            <span>한줄 설명</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="가성비 좋음"
            />
          </label>

          {error ? <p className="form-message">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '등록 중' : '등록하기'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default App;
