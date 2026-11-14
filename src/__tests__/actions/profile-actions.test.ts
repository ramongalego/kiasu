import {
  mockPrisma,
  mockRevalidatePath,
  mockAuthenticated,
  mockUnauthenticated,
  mockUpdateUser,
  mockSignInWithPassword,
  TEST_USER,
} from '../helpers/mocks';

import {
  updateUsername,
  updateEmail,
  changePassword,
} from '@/app/(app)/profile/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── updateUsername ──────────────────────────────────────────
describe('updateUsername', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await updateUsername('newname');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error for too-short username', async () => {
    mockAuthenticated();
    const result = await updateUsername('ab');
    expect(result).toEqual({
      error: 'Username must be at least 3 characters',
    });
  });

  it('returns error for username with special characters', async () => {
    mockAuthenticated();
    const result = await updateUsername('bad@name!');
    expect(result).toEqual({
      error: 'Username can only contain letters, numbers, and underscores',
    });
  });

  it('returns error when username is taken', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

    const result = await updateUsername('taken_name');
    expect(result).toEqual({ error: 'Username is already taken' });
  });

  it('updates Prisma and Supabase on success', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue({});
    mockUpdateUser.mockResolvedValue({ error: null });

    const result = await updateUsername('new_name');

    expect(result).toEqual({ success: true, username: 'new_name' });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USER.id },
      data: { username: 'new_name' },
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { username: 'new_name' },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
  });

  it('excludes current user from uniqueness check', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.update.mockResolvedValue({});
    mockUpdateUser.mockResolvedValue({ error: null });

    await updateUsername('my_name');

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        username: { equals: 'my_name', mode: 'insensitive' },
        id: { not: TEST_USER.id },
      },
    });
  });
});

// ── updateEmail ────────────────────────────────────────────
describe('updateEmail', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await updateEmail('new@example.com');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error for invalid email', async () => {
    mockAuthenticated();
    const result = await updateEmail('not-an-email');
    expect(result).toEqual({ error: 'Must be a valid email' });
  });

  it('returns error when email is taken', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

    const result = await updateEmail('taken@example.com');
    expect(result).toEqual({ error: 'Email is already taken' });
  });

  it('returns error when Supabase update fails', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const result = await updateEmail('new@example.com');
    expect(result).toEqual({ error: 'Rate limit exceeded' });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it('asks Supabase to change the email without trusting it yet', async () => {
    mockAuthenticated();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockUpdateUser.mockResolvedValue({ error: null });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await updateEmail('new@example.com');

    expect(result).toEqual({ success: true, confirmationRequired: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/');
  });
});

// ── changePassword ─────────────────────────────────────────
describe('changePassword', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await changePassword('old', 'newpassword');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when current password is empty', async () => {
    mockAuthenticated();
    const result = await changePassword('', 'newpassword');
    expect(result).toEqual({ error: 'Current password is required' });
  });

  it('returns error when new password is too short', async () => {
    mockAuthenticated();
    const result = await changePassword('oldpassword', 'short');
    expect(result).toEqual({
      error: 'Password must be at least 6 characters',
    });
  });

  it('returns error when current password is wrong', async () => {
    mockAuthenticated();
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const result = await changePassword('wrongpass', 'newpassword');
    expect(result).toEqual({ error: 'Current password is incorrect' });
  });

  it('returns error when Supabase update fails', async () => {
    mockAuthenticated();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Password too weak' },
    });

    const result = await changePassword('oldpassword', 'newpassword');
    expect(result).toEqual({ error: 'Password too weak' });
  });

  it('returns success when password is changed', async () => {
    mockAuthenticated();
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });

    const result = await changePassword('oldpassword', 'newpassword');

    expect(result).toEqual({ success: true });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: TEST_USER.email,
      password: 'oldpassword',
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newpassword',
    });
  });
});
