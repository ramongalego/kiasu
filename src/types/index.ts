export interface User {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  profilePictureUrl: string | null;
  role: string;
  tier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyList {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  isPublic: boolean;
  position: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyItem {
  id: string;
  title: string;
  notes: string | null;
  url: string | null;
  completed: boolean;
  position: number;
  studyListId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyListWithItemCount extends StudyList {
  _count: {
    items: number;
    completedItems: number;
  };
  copiedFrom?: {
    user: {
      username: string | null;
    };
  } | null;
}

export type OptimisticStudyItem = StudyItem & { pending?: boolean };

export type OptimisticStudyListWithItemCount = StudyListWithItemCount & {
  pending?: boolean;
};

export type StudyItemAction =
  | { type: 'create'; item: OptimisticStudyItem }
  | { type: 'toggle'; itemId: string }
  | { type: 'delete'; itemId: string }
  | { type: 'update'; itemId: string; data: Partial<StudyItem> }
  | { type: 'reorder'; orderedIds: string[] };

export type StudyListAction =
  | { type: 'create'; list: OptimisticStudyListWithItemCount }
  | { type: 'update'; listId: string; data: Partial<StudyList> }
  | { type: 'delete'; listId: string }
  | { type: 'reorder'; orderedIds: string[] };
