import {
  mockPrisma,
  mockRevalidatePath,
  mockAuthenticated,
  mockUnauthenticated,
  TEST_USER,
  OTHER_USER,
  TEST_STUDY_LIST,
} from '../helpers/mocks';

import { copyStudyList } from '@/app/discovery/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── copyStudyList ─────────────────────────────────────────

describe('copyStudyList', () => {
  const SOURCE_LIST = {
    ...TEST_STUDY_LIST,
    userId: OTHER_USER.id,
    isPublic: true,
    items: [
      {
        id: 'item-1',
        title: 'Item 1',
        notes: 'Notes 1',
        url: 'https://example.com/1',
        position: 0,
        completed: true,
      },
      {
        id: 'item-2',
        title: 'Item 2',
        notes: null,
        url: null,
        position: 1,
        completed: false,
      },
    ],
  };

  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await copyStudyList('list-1');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when study list not found', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(null);

    const result = await copyStudyList('nonexistent');
    expect(result).toEqual({ error: 'Study list not found' });
  });

  it('returns error when trying to copy own list', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue({
      ...SOURCE_LIST,
      userId: TEST_USER.id,
    });

    const result = await copyStudyList('list-1');
    expect(result).toEqual({ error: 'You cannot copy your own list' });
  });

  it('returns error when list was already copied', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST) // source lookup
      .mockResolvedValueOnce({ id: 'existing-copy' }); // alreadyCopied check

    const result = await copyStudyList('list-1');
    expect(result).toEqual({ error: 'You already saved this list' });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('copies the study list with items and returns slug', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST) // source lookup
      .mockResolvedValueOnce(null); // alreadyCopied check
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    const createdList = { ...TEST_STUDY_LIST, slug: 'my-study-list' };
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.studyList.create.mockResolvedValue(createdList);

    const result = await copyStudyList('list-1');

    expect(result).toEqual({ success: true, slug: 'my-study-list' });
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('creates the list as private with copiedFromId', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST)
      .mockResolvedValueOnce(null);
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.studyList.create.mockResolvedValue({
      ...TEST_STUDY_LIST,
      slug: 'my-study-list',
    });

    await copyStudyList('list-1');

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: SOURCE_LIST.title,
        description: SOURCE_LIST.description,
        category: SOURCE_LIST.category,
        isPublic: false,
        position: 0,
        userId: TEST_USER.id,
        copiedFromId: SOURCE_LIST.id,
      }),
    });
  });

  it('copies items with completed reset to false', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST)
      .mockResolvedValueOnce(null);
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.studyList.create.mockResolvedValue({
      ...TEST_STUDY_LIST,
      slug: 'my-study-list',
    });

    await copyStudyList('list-1');

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        items: {
          create: [
            {
              title: 'Item 1',
              notes: 'Notes 1',
              url: 'https://example.com/1',
              position: 0,
              completed: false,
            },
            {
              title: 'Item 2',
              notes: null,
              url: null,
              position: 1,
              completed: false,
            },
          ],
        },
      }),
    });
  });

  it('deduplicates slug when one already exists', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST)
      .mockResolvedValueOnce(null);
    mockPrisma.studyList.findUnique.mockResolvedValue({ id: 'existing' });
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    mockPrisma.studyList.create.mockResolvedValue({
      ...TEST_STUDY_LIST,
      slug: `my-study-list-${now}`,
    });

    const result = await copyStudyList('list-1');

    expect(result).toEqual({
      success: true,
      slug: `my-study-list-${now}`,
    });
    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: `my-study-list-${now}`,
      }),
    });

    vi.restoreAllMocks();
  });

  it('shifts existing list positions up by 1', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST)
      .mockResolvedValueOnce(null);
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.studyList.create.mockResolvedValue({
      ...TEST_STUDY_LIST,
      slug: 'my-study-list',
    });

    await copyStudyList('list-1');

    expect(mockPrisma.studyList.updateMany).toHaveBeenCalledWith({
      where: { userId: TEST_USER.id },
      data: { position: { increment: 1 } },
    });
  });

  it('revalidates /dashboard and /discovery paths', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(SOURCE_LIST)
      .mockResolvedValueOnce(null);
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.studyList.create.mockResolvedValue({
      ...TEST_STUDY_LIST,
      slug: 'my-study-list',
    });

    await copyStudyList('list-1');

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/discovery');
  });
});
