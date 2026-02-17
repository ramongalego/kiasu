import {
  mockPrisma,
  mockRevalidatePath,
  mockAuthenticated,
  mockUnauthenticated,
  TEST_USER,
} from '../helpers/mocks';

import { voteStudyList } from '@/app/discovery/actions';

// Valid UUID for testing (Zod validates UUID format)
const LIST_ID = '00000000-0000-4000-8000-000000000001';

function mockPublicList() {
  mockPrisma.studyList.findFirst.mockResolvedValue({ id: LIST_ID });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── voteStudyList ───────────────────────────────────────────

describe('voteStudyList', () => {
  // ── Input validation ─────────────────────────────────────

  it('rejects an invalid vote type', async () => {
    const result = await voteStudyList(LIST_ID, 'INVALID' as 'UP');
    expect(result).toEqual({ error: 'Invalid vote parameters' });
  });

  it('rejects a non-UUID studyListId', async () => {
    const result = await voteStudyList('not-a-uuid', 'UP');
    expect(result).toEqual({ error: 'Invalid vote parameters' });
  });

  // ── Auth ─────────────────────────────────────────────────

  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await voteStudyList(LIST_ID, 'UP');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  // ── List existence check ─────────────────────────────────

  it('returns error when study list does not exist', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(null);

    const result = await voteStudyList(LIST_ID, 'UP');

    expect(result).toEqual({ error: 'Study list not found' });
    expect(mockPrisma.studyList.findFirst).toHaveBeenCalledWith({
      where: { id: LIST_ID, isPublic: true },
      select: { id: true },
    });
  });

  // ── Vote creation ────────────────────────────────────────

  it('creates a new upvote when no existing vote', async () => {
    mockAuthenticated();
    mockPublicList();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'UP');

    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: { type: 'UP', userId: TEST_USER.id, studyListId: LIST_ID },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/discovery');
    expect(result).toEqual({ success: true });
  });

  it('creates a new downvote when no existing vote', async () => {
    mockAuthenticated();
    mockPublicList();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'DOWN');

    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: { type: 'DOWN', userId: TEST_USER.id, studyListId: LIST_ID },
    });
    expect(result).toEqual({ success: true });
  });

  // ── Vote toggling ────────────────────────────────────────

  it('deletes vote when toggling off an existing upvote', async () => {
    mockAuthenticated();
    mockPublicList();
    const existingVote = {
      id: 'vote-1',
      type: 'UP',
      userId: TEST_USER.id,
      studyListId: LIST_ID,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.delete.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'UP');

    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: { id: 'vote-1' },
    });
    expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    expect(mockPrisma.vote.update).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('deletes vote when toggling off an existing downvote', async () => {
    mockAuthenticated();
    mockPublicList();
    const existingVote = {
      id: 'vote-2',
      type: 'DOWN',
      userId: TEST_USER.id,
      studyListId: LIST_ID,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.delete.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'DOWN');

    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: { id: 'vote-2' },
    });
    expect(result).toEqual({ success: true });
  });

  // ── Vote switching ───────────────────────────────────────

  it('updates vote when switching from upvote to downvote', async () => {
    mockAuthenticated();
    mockPublicList();
    const existingVote = {
      id: 'vote-1',
      type: 'UP',
      userId: TEST_USER.id,
      studyListId: LIST_ID,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.update.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'DOWN');

    expect(mockPrisma.vote.update).toHaveBeenCalledWith({
      where: { id: 'vote-1' },
      data: { type: 'DOWN' },
    });
    expect(mockPrisma.vote.delete).not.toHaveBeenCalled();
    expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('updates vote when switching from downvote to upvote', async () => {
    mockAuthenticated();
    mockPublicList();
    const existingVote = {
      id: 'vote-2',
      type: 'DOWN',
      userId: TEST_USER.id,
      studyListId: LIST_ID,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.update.mockResolvedValue({});

    const result = await voteStudyList(LIST_ID, 'UP');

    expect(mockPrisma.vote.update).toHaveBeenCalledWith({
      where: { id: 'vote-2' },
      data: { type: 'UP' },
    });
    expect(result).toEqual({ success: true });
  });

  // ── Revalidation ─────────────────────────────────────────

  it('revalidates /discovery path after voting', async () => {
    mockAuthenticated();
    mockPublicList();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    await voteStudyList(LIST_ID, 'UP');

    expect(mockRevalidatePath).toHaveBeenCalledWith('/discovery');
  });
});
