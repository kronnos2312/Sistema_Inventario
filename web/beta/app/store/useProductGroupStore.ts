import { create } from 'zustand';
import { ProductGroup } from '../model/ProductGroup';
import { useToastStore } from './useToastStore';

type State = {
  groups: ProductGroup[];
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, description: string) => Promise<ProductGroup | null>;
  updateGroup: (group: ProductGroup) => Promise<boolean>;
  deleteGroup: (id: number) => Promise<void>;
  setGroupCategories: (groupId: number, categoryIds: number[]) => Promise<boolean>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useProductGroupStore = create<State>((set, get) => ({
  groups: [],

  fetchGroups: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-group`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ groups: data });
    } catch {
      useToastStore.getState().showToast('Error al cargar grupos', 'error');
    }
  },

  createGroup: async (name, description) => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error();
      const created: ProductGroup = await res.json();
      await get().fetchGroups();
      useToastStore.getState().showToast('Grupo creado correctamente', 'success');
      return created;
    } catch {
      useToastStore.getState().showToast('Error al crear el grupo', 'error');
      return null;
    }
  },

  updateGroup: async (group) => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-group`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group),
      });
      if (!res.ok) throw new Error();
      await get().fetchGroups();
      useToastStore.getState().showToast('Grupo actualizado', 'success');
      return true;
    } catch {
      useToastStore.getState().showToast('Error al actualizar el grupo', 'error');
      return false;
    }
  },

  deleteGroup: async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-group/id/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await get().fetchGroups();
      useToastStore.getState().showToast('Grupo eliminado', 'success');
    } catch {
      useToastStore.getState().showToast('Error al eliminar el grupo', 'error');
    }
  },

  setGroupCategories: async (groupId, categoryIds) => {
    try {
      const res = await fetch(`${API_BASE_URL}/product-group/${groupId}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryIds),
      });
      if (!res.ok) throw new Error();
      await get().fetchGroups();
      useToastStore.getState().showToast('Categorías del grupo actualizadas', 'success');
      return true;
    } catch {
      useToastStore.getState().showToast('Error al actualizar categorías del grupo', 'error');
      return false;
    }
  },
}));
