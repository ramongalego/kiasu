import {
  mockPrisma,
  mockRevalidatePath,
  mockAuthenticated,
  mockUnauthenticated,
  TEST_USER,
  TEST_STUDY_LIST,
} from '../helpers/mocks';

import { voteStudyList } from '@/app/discovery/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── voteStudyList ───────────────────────────────────────────

describe('voteStudyList', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await voteStudyList(TEST_STUDY_LIST.id, 'UP');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('creates a new upvote when no existing vote', async () => {
    mockAuthenticated();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'UP');

    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: {
        type: 'UP',
        userId: TEST_USER.id,
        studyListId: TEST_STUDY_LIST.id,
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/discovery');
    expect(result).toEqual({ success: true });
  });

  it('creates a new downvote when no existing vote', async () => {
    mockAuthenticated();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'DOWN');

    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: {
        type: 'DOWN',
        userId: TEST_USER.id,
        studyListId: TEST_STUDY_LIST.id,
      },
    });
    expect(result).toEqual({ success: true });
  });

  it('deletes vote when toggling off an existing upvote', async () => {
    mockAuthenticated();
    const existingVote = {
      id: 'vote-1',
      type: 'UP',
      userId: TEST_USER.id,
      studyListId: TEST_STUDY_LIST.id,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.delete.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'UP');

    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: { id: 'vote-1' },
    });
    expect(mockPrisma.vote.create).not.toHaveBeenCalled();
    expect(mockPrisma.vote.update).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it('deletes vote when toggling off an existing downvote', async () => {
    mockAuthenticated();
    const existingVote = {
      id: 'vote-2',
      type: 'DOWN',
      userId: TEST_USER.id,
      studyListId: TEST_STUDY_LIST.id,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.delete.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'DOWN');

    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: { id: 'vote-2' },
    });
    expect(result).toEqual({ success: true });
  });

  it('updates vote when switching from upvote to downvote', async () => {
    mockAuthenticated();
    const existingVote = {
      id: 'vote-1',
      type: 'UP',
      userId: TEST_USER.id,
      studyListId: TEST_STUDY_LIST.id,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.update.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'DOWN');

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
    const existingVote = {
      id: 'vote-2',
      type: 'DOWN',
      userId: TEST_USER.id,
      studyListId: TEST_STUDY_LIST.id,
    };
    mockPrisma.vote.findUnique.mockResolvedValue(existingVote);
    mockPrisma.vote.update.mockResolvedValue({});

    const result = await voteStudyList(TEST_STUDY_LIST.id, 'UP');

    expect(mockPrisma.vote.update).toHaveBeenCalledWith({
      where: { id: 'vote-2' },
      data: { type: 'UP' },
    });
    expect(result).toEqual({ success: true });
  });

  it('revalidates /discovery path after voting', async () => {
    mockAuthenticated();
    mockPrisma.vote.findUnique.mockResolvedValue(null);
    mockPrisma.vote.create.mockResolvedValue({});

    await voteStudyList(TEST_STUDY_LIST.id, 'UP');

    expect(mockRevalidatePath).toHaveBeenCalledWith('/discovery');
  });
});
