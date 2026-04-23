import { AuthSession, InviteVerificationResult, LoginInput, RegisterInput } from '../types';

const SESSION_STORAGE_KEY = 'tf-michelin-session';
const USERS_STORAGE_KEY = 'tf-michelin-users';
const MOCK_INVITE_CODE = 'ABC123';
const MOCK_ORGANIZATION = {
  id: 'tf-pangyo',
  name: 'TF / 판교',
};

type MockUser = {
  id: string;
  organizationId: string;
  organizationName: string;
  nickname: string;
  password: string;
};

const defaultUsers: MockUser[] = [
  {
    id: 'mock-user',
    organizationId: MOCK_ORGANIZATION.id,
    organizationName: MOCK_ORGANIZATION.name,
    nickname: 'TF식신',
    password: 'password',
  },
];

export async function getAuthSession(): Promise<AuthSession | null> {
  const session = window.localStorage.getItem(SESSION_STORAGE_KEY);
  return session ? (JSON.parse(session) as AuthSession) : null;
}

export async function verifyInviteCode(code: string): Promise<InviteVerificationResult> {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    return {
      success: false,
      message: '초대코드를 입력해주세요.',
    };
  }

  if (normalizedCode !== MOCK_INVITE_CODE) {
    return {
      success: false,
      message: '유효하지 않은 초대코드입니다.',
    };
  }

  return {
    success: true,
    organization: MOCK_ORGANIZATION,
    message: '회사/조직이 확인되었습니다.',
  };
}

export async function registerAccount(input: RegisterInput): Promise<AuthSession> {
  const nickname = input.nickname.trim();
  const password = input.password.trim();

  if (!input.organization || !nickname || !password) {
    throw new Error('조직 확인, 닉네임, 패스워드를 모두 입력해주세요.');
  }

  const users = getMockUsers();
  const duplicatedUser = users.some(
    (user) => user.organizationId === input.organization?.id && user.nickname === nickname,
  );

  if (duplicatedUser) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  const user: MockUser = {
    id: `mock-user-${Date.now()}`,
    organizationId: input.organization.id,
    organizationName: input.organization.name,
    nickname,
    password,
  };

  saveMockUsers([user, ...users]);

  const session = toSession(user);
  saveSession(session);
  return session;
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const nickname = input.nickname.trim();
  const password = input.password.trim();

  if (!nickname || !password) {
    throw new Error('닉네임과 패스워드를 입력해주세요.');
  }

  const user = getMockUsers().find((candidate) => candidate.nickname === nickname && candidate.password === password);

  if (!user) {
    throw new Error('닉네임 또는 패스워드가 일치하지 않습니다.');
  }

  const session = toSession(user);
  saveSession(session);
  return session;
}

export async function logout() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function getMockUsers(): MockUser[] {
  const users = window.localStorage.getItem(USERS_STORAGE_KEY);
  return users ? (JSON.parse(users) as MockUser[]) : defaultUsers;
}

function saveMockUsers(users: MockUser[]) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function saveSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function toSession(user: MockUser): AuthSession {
  return {
    userId: user.id,
    nickname: user.nickname,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
  };
}
