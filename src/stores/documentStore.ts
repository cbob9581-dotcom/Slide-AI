import { create } from 'zustand';
import type { Document, Page } from '../types';

interface DocumentState {
  currentDoc: Document | null;
  pages: Page[];
  currentPage: number;
  setDocument: (doc: Document) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: number) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  updateDocument: (updates: Partial<Document>) => void;
  clearDocument: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDoc: null,
  pages: [],
  currentPage: 1,

  setDocument: (doc) => set({ currentDoc: doc, currentPage: 1 }),

  setPages: (pages) => set({ pages }),

  setCurrentPage: (page) => set({ currentPage: page }),

  updatePage: (pageId, updates) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, ...updates } : p
      ),
    })),

  updateDocument: (updates) =>
    set((state) => ({
      currentDoc: state.currentDoc
        ? { ...state.currentDoc, ...updates }
        : null,
    })),

  clearDocument: () =>
    set({ currentDoc: null, pages: [], currentPage: 1 }),
}));
