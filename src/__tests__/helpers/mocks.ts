import { vi } from 'vitest';

// ── Test Users ──────────────────────────────────────────────
export const TEST_USER = { id: 'user-1', email: 'test@example.com' };
export const OTHER_USER = { id: 'user-2', email: 'other@example.com' };

// ── Test Data ───────────────────────────────────────────────
export const TEST_STUDY_LIST = {
  id: 'list-1',
  title: 'My Study List',
  description: 'A description',
  slug: 'my-study-list',
  category: 'programming',
  isPublic: true,
  position: 0,
  userId: TEST_USER.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const TEST_STUDY_ITEM = {
  id: 'item-1',
  title: 'Study Item',
  notes: 'Some notes',
  url: 'https://example.com',
  completed: false,
  position: 0,
  studyListId: TEST_STUDY_LIST.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  studyList: { userId: TEST_USER.id },
};

// ── FormData Helper ─────────────────────────────────────────
export function createFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

// ── Supabase Mock ───────────────────────────────────────────
export const mockGetUser = vi.fn();
export const mockExchangeCodeForSession = vi.fn();
export const mockUpdateUser = vi.fn();
export const mockSignInWithPassword = vi.fn();

export const mockStorageUpload = vi.fn();
export const mockStorageList = vi.fn();
export const mockStorageRemove = vi.fn();
export const mockStorageGetPublicUrl = vi.fn();

const mockStorageFrom = vi.fn().mockReturnValue({
  upload: (...args: unknown[]) => mockStorageUpload(...args),
  list: (...args: unknown[]) => mockStorageList(...args),
  remove: (...args: unknown[]) => mockStorageRemove(...args),
  getPublicUrl: (...args: unknown[]) => mockStorageGetPublicUrl(...args),
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      signInWithPassword: (...args: unknown[]) =>
        mockSignInWithPassword(...args),
    },
    storage: {
      from: (...args: unknown[]) => mockStorageFrom(...args),
    },
  }),
}));

// ── Prisma Mock ─────────────────────────────────────────────
export const mockPrisma = {
  studyList: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  studyItem: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  $transaction: vi.fn((args: unknown) =>
    Array.isArray(args) ? Promise.all(args) : (args as () => unknown)(),
  ),
};

vi.mock('@/lib/prisma/client', () => ({
  prisma: mockPrisma,
}));

// ── Next.js Cache Mock ──────────────────────────────────────
export const mockRevalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// ── Auth Helper ─────────────────────────────────────────────
export function mockAuthenticated(user = TEST_USER) {
  mockGetUser.mockResolvedValue({ data: { user } });
  mockPrisma.user.findUnique.mockResolvedValue({ id: user.id, tier: 'free' });
}

export function mockUnauthenticated() {
  mockGetUser.mockResolvedValue({ data: { user: null } });
}
