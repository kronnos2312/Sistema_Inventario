import { create } from 'zustand';
import { Role, User } from '../model/User';
import { useToastStore } from './useToastStore';

type CreateUserInput = {
  username: string;
  password: string;
  fullName: string;
  role: Role;
};

type State = {
  users: User[];
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserInput) => Promise<boolean>;
  updateUserRole: (id: number, role: Role) => Promise<void>;
  setUserActive: (id: number, active: boolean) => Promise<void>;
  resetPassword: (id: number, newPassword: string) => Promise<boolean>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useUserStore = create<State>((set, get) => ({
  users: [],

  fetchUsers: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error();
      set({ users: await res.json() });
    } catch {
      useToastStore.getState().showToast('Error al cargar usuarios', 'error');
    }
  },

  createUser: async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.status === 409) {
        useToastStore.getState().showToast('Ese nombre de usuario ya existe', 'error');
        return false;
      }
      if (!res.ok) throw new Error();
      await get().fetchUsers();
      useToastStore.getState().showToast('Usuario creado correctamente', 'success');
      return true;
    } catch {
      useToastStore.getState().showToast('Error al crear el usuario', 'error');
      return false;
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      await get().fetchUsers();
      useToastStore.getState().showToast('Rol actualizado', 'success');
    } catch {
      useToastStore.getState().showToast('Error al actualizar el rol', 'error');
    }
  },

  setUserActive: async (id, active) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error();
      await get().fetchUsers();
      useToastStore.getState().showToast(active ? 'Usuario desbloqueado' : 'Usuario bloqueado', 'success');
    } catch {
      useToastStore.getState().showToast('Error al actualizar el usuario', 'error');
    }
  },

  resetPassword: async (id, newPassword) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error();
      useToastStore.getState().showToast('Contraseña actualizada', 'success');
      return true;
    } catch {
      useToastStore.getState().showToast('Error al actualizar la contraseña', 'error');
      return false;
    }
  },
}));
