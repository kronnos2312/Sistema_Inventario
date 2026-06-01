import { create } from 'zustand'
import { InventoryItem } from '../model/InventoryItem'
import { useToastStore } from './useToastStore';
import { useLoaderStore } from '@/app/store/useLoaderStore';
import { WInventory } from '../model/WithdrawInventory';

type State = {
  inventory: InventoryItem[];
  inventoryShow: InventoryItem;
  setInventory: (data: InventoryItem[]) => void;
  fetchInventory: () => Promise<void>;
  clearShowInventory: () => void;
  saveInventory: (data: InventoryItem) => Promise<boolean>;
  getOutInventory: (data: WInventory) => Promise<void>;
  deleteInventory: (data: InventoryItem) => Promise<void>;
};

const emptyItem: InventoryItem = {
  id: 0, quantity: 0, price: 0, description: '',
  product: { id: 0, name: '', brand: '', model: '' },
  arrivalDate: '', outDate: '', barcode: '',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const useInventoryStore = create<State>((set, get) => ({
  inventory: [],
  inventoryShow: emptyItem,

  setInventory: (data) => set({ inventory: data }),

  clearShowInventory: () => set({ inventoryShow: emptyItem }),

  getOutInventory: async (data: WInventory) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.codeName !== 'error') {
        await get().fetchInventory();
        get().clearShowInventory();
        useToastStore.getState().showToast('Inventario retirado correctamente', 'success');
      } else {
        useToastStore.getState().showToast('Error al retirar: ' + result.messageName, 'error');
      }
    } catch (error) {
      useToastStore.getState().showToast('Error al retirar inventario: ' + error, 'error');
    }
  },

  saveInventory: async (data: InventoryItem): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/dto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.codeName !== 'error') {
        await get().fetchInventory();
        get().clearShowInventory();
        useToastStore.getState().showToast('Inventario guardado correctamente', 'success');
        return true;
      } else {
        useToastStore.getState().showToast('Error al guardar: ' + result.messageName, 'error');
        return false;
      }
    } catch (error) {
      useToastStore.getState().showToast('Error al guardar inventario: ' + error, 'error');
      return false;
    }
  },

  deleteInventory: async (data: InventoryItem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/inventory/id/${data.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      await get().fetchInventory();
      useToastStore.getState().showToast('Registro eliminado correctamente', 'success');
    } catch (error) {
      useToastStore.getState().showToast('Error al eliminar: ' + error, 'error');
    }
  },

  fetchInventory: async () => {
    const { showLoader, hideLoader } = useLoaderStore.getState();
    showLoader();
    try {
      const res = await fetch(`${API_BASE_URL}/inventory`);
      if (!res.ok) throw new Error('Error al obtener inventario');
      const data = await res.json();
      set({ inventory: data });
    } catch {
      useToastStore.getState().showToast('Error al cargar inventario', 'error');
    } finally {
      hideLoader();
    }
  },
}));
