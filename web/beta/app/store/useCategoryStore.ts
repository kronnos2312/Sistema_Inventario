import { create } from 'zustand';
import { Category } from '../model/Category';
import { useToastStore } from './useToastStore';

type State = {
  categories: Category[];
  fetchCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<Category | null>;
  updateCategory: (category: Category) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<void>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useCategoryStore = create<State>((set, get) => ({
  categories: [],

  fetchCategories: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/category`);
      if (!res.ok) throw new Error();
      set({ categories: await res.json() });
    } catch {
      useToastStore.getState().showToast('Error al cargar categorías', 'error');
    }
  },

  createCategory: async (name) => {
    try {
      const res = await fetch(`${API_BASE_URL}/category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      const created: Category = await res.json();
      await get().fetchCategories();
      useToastStore.getState().showToast('Categoría creada', 'success');
      return created;
    } catch {
      useToastStore.getState().showToast('Error al crear la categoría', 'error');
      return null;
    }
  },

  updateCategory: async (category) => {
    try {
      const res = await fetch(`${API_BASE_URL}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!res.ok) throw new Error();
      await get().fetchCategories();
      useToastStore.getState().showToast('Categoría actualizada', 'success');
      return true;
    } catch {
      useToastStore.getState().showToast('Error al actualizar la categoría', 'error');
      return false;
    }
  },

  deleteCategory: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/category/id/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await get().fetchCategories();
      useToastStore.getState().showToast('Categoría eliminada', 'success');
    } catch {
      useToastStore.getState().showToast('Error al eliminar la categoría', 'error');
    }
  },
}));
