import {
  mockPrisma,
  mockRevalidatePath,
  mockAuthenticated,
  mockUnauthenticated,
  createFormData,
  TEST_USER,
  TEST_STUDY_LIST,
} from '../helpers/mocks';

import {
  createStudyList,
  updateStudyList,
  deleteStudyList,
  reorderStudyLists,
} from '@/app/(app)/dashboard/actions';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createStudyList ─────────────────────────────────────────
describe('createStudyList', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await createStudyList(createFormData({ title: 'Test' }));
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when title is empty', async () => {
    mockAuthenticated();
    const result = await createStudyList(
      createFormData({ title: '', category: 'programming' }),
    );
    expect(result).toEqual({ error: 'Title is required' });
  });

  it('returns error when title is only whitespace', async () => {
    mockAuthenticated();
    const result = await createStudyList(
      createFormData({ title: '   ', category: 'programming' }),
    );
    expect(result).toEqual({ error: 'Title is required' });
  });

  it('returns error when category is missing', async () => {
    mockAuthenticated();
    const result = await createStudyList(createFormData({ title: 'Test' }));
    expect(result).toEqual({ error: 'Category is required' });
  });

  it('returns error when category is invalid', async () => {
    mockAuthenticated();
    const result = await createStudyList(
      createFormData({ title: 'Test', category: 'invalid-category' }),
    );
    expect(result).toEqual({ error: 'Category is required' });
  });

  it('creates a study list with generated slug', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    const result = await createStudyList(
      createFormData({
        title: 'My Study List',
        description: 'A description',
        category: 'programming',
      }),
    );

    expect(result).toEqual({ success: true });
    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'My Study List',
        description: 'A description',
        slug: 'my-study-list',
        category: 'programming',
        userId: TEST_USER.id,
      }),
    });
  });

  it('deduplicates slug when one already exists', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(TEST_STUDY_LIST);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    await createStudyList(
      createFormData({ title: 'My Study List', category: 'programming' }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        slug: `my-study-list-${now}`,
      }),
    });

    vi.restoreAllMocks();
  });

  it('trims title and description', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({
        title: '  Trimmed  ',
        description: '  Desc  ',
        category: 'programming',
      }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Trimmed',
        description: 'Desc',
      }),
    });
  });

  it('sets description to null when empty', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({ title: 'Test', category: 'programming' }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: null,
      }),
    });
  });

  it('creates a public list when isPublic is true', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({
        title: 'Test',
        category: 'programming',
        isPublic: 'true',
      }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isPublic: true }),
    });
  });

  it('creates a private list when isPublic is false', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({
        title: 'Test',
        category: 'programming',
        isPublic: 'false',
      }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isPublic: false }),
    });
  });

  it('defaults to private when isPublic is not provided', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({ title: 'Test', category: 'programming' }),
    );

    expect(mockPrisma.studyList.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ isPublic: false }),
    });
  });

  it('calls revalidatePath for /dashboard', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findUnique.mockResolvedValue(null);
    mockPrisma.studyList.create.mockResolvedValue(TEST_STUDY_LIST);

    await createStudyList(
      createFormData({ title: 'Test', category: 'programming' }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

// ── updateStudyList ─────────────────────────────────────────
describe('updateStudyList', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await updateStudyList(
      createFormData({ id: 'list-1', title: 'Updated' }),
    );
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when study list not found', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(null);

    const result = await updateStudyList(
      createFormData({
        id: 'nonexistent',
        title: 'Updated',
        category: 'programming',
      }),
    );
    expect(result).toEqual({ error: 'Learning path not found' });
  });

  it('returns error when user does not own the list', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(null); // findFirst with userId filter returns null

    const result = await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'Updated',
        category: 'programming',
      }),
    );
    expect(result).toEqual({ error: 'Learning path not found' });
  });

  it('returns error when title is empty', async () => {
    mockAuthenticated();
    const result = await updateStudyList(
      createFormData({ id: 'list-1', title: '', category: 'programming' }),
    );
    expect(result).toEqual({ error: 'Title is required' });
  });

  it('keeps slug if title unchanged', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(TEST_STUDY_LIST);
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    const result = await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'My Study List',
        description: 'New desc',
        category: 'programming',
      }),
    );

    expect(result).toEqual({ success: true, slug: 'my-study-list' });
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: expect.objectContaining({
        slug: 'my-study-list',
      }),
    });
  });

  it('regenerates slug when title changes', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(TEST_STUDY_LIST) // ownership check
      .mockResolvedValueOnce(null); // slug uniqueness check
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    const result = await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'New Title',
        category: 'programming',
      }),
    );

    expect(result).toEqual({ success: true, slug: 'new-title' });
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: expect.objectContaining({
        slug: 'new-title',
      }),
    });
  });

  it('updates isPublic to false', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(TEST_STUDY_LIST);
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'My Study List',
        category: 'programming',
        isPublic: 'false',
      }),
    );

    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: expect.objectContaining({ isPublic: false }),
    });
  });

  it('updates isPublic to true', async () => {
    mockAuthenticated();
    const privateList = { ...TEST_STUDY_LIST, isPublic: false };
    mockPrisma.studyList.findFirst.mockResolvedValue(privateList);
    mockPrisma.studyList.update.mockResolvedValue(privateList);

    await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'My Study List',
        category: 'programming',
        isPublic: 'true',
      }),
    );

    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: expect.objectContaining({ isPublic: true }),
    });
  });

  it('handles slug collision on title change', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(TEST_STUDY_LIST) // ownership check
      .mockResolvedValueOnce({ id: 'other-list' }); // slug taken
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const result = await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'New Title',
        category: 'programming',
      }),
    );

    expect(result).toEqual({ success: true, slug: `new-title-${now}` });
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: expect.objectContaining({
        slug: `new-title-${now}`,
      }),
    });

    vi.restoreAllMocks();
  });

  it('revalidates old and new slug paths when slug changes', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst
      .mockResolvedValueOnce(TEST_STUDY_LIST) // ownership check
      .mockResolvedValueOnce(null); // slug uniqueness check
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'New Title',
        category: 'programming',
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/my-study-list');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/new-title');
  });

  it('revalidates slug path even when slug stays the same', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(TEST_STUDY_LIST);
    mockPrisma.studyList.update.mockResolvedValue(TEST_STUDY_LIST);

    await updateStudyList(
      createFormData({
        id: 'list-1',
        title: 'My Study List',
        description: 'Updated desc',
        category: 'programming',
      }),
    );

    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/my-study-list');
  });
});

// ── deleteStudyList ─────────────────────────────────────────
describe('deleteStudyList', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await deleteStudyList('list-1');
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when list not found or not owned', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(null);

    const result = await deleteStudyList('nonexistent');
    expect(result).toEqual({ error: 'Learning path not found' });
  });

  it('deletes the list and revalidates', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findFirst.mockResolvedValue(TEST_STUDY_LIST);
    mockPrisma.studyList.delete.mockResolvedValue(TEST_STUDY_LIST);

    const result = await deleteStudyList('list-1');

    expect(result).toEqual({ success: true });
    expect(mockPrisma.studyList.delete).toHaveBeenCalledWith({
      where: { id: 'list-1' },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});

// ── reorderStudyLists ───────────────────────────────────────
describe('reorderStudyLists', () => {
  it('returns error when unauthenticated', async () => {
    mockUnauthenticated();
    const result = await reorderStudyLists(['list-1', 'list-2']);
    expect(result).toEqual({ error: 'Not authenticated' });
  });

  it('returns error when an ID does not belong to the user', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findMany.mockResolvedValue([{ id: 'list-1' }]);

    const result = await reorderStudyLists(['list-1', 'foreign-id']);
    expect(result).toEqual({ error: 'Invalid list ID' });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('updates positions in order and revalidates', async () => {
    mockAuthenticated();
    mockPrisma.studyList.findMany.mockResolvedValue([
      { id: 'list-1' },
      { id: 'list-2' },
      { id: 'list-3' },
    ]);
    mockPrisma.studyList.update.mockResolvedValue({});

    const result = await reorderStudyLists(['list-3', 'list-1', 'list-2']);

    expect(result).toEqual({ success: true });
    expect(mockPrisma.$transaction).toHaveBeenCalledWith([
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ]);
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-3' },
      data: { position: 0 },
    });
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-1' },
      data: { position: 1 },
    });
    expect(mockPrisma.studyList.update).toHaveBeenCalledWith({
      where: { id: 'list-2' },
      data: { position: 2 },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
  });
});
