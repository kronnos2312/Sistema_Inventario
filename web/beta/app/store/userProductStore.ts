import { create } from 'zustand'
import { Product } from '../model/Product';
import { useToastStore } from './useToastStore';
import { useLoaderStore } from '@/app/store/useLoaderStore';

type State = {
  product: Product[];
  showProduct: Product;
  setProduct: (data: Product[]) => void;
  clearShowProduct: () => void;
  fetchProduct: (silent?: boolean) => Promise<void>;
  saveProduct: (data: Product) => Promise<boolean>;
  deleteProduct: (data: Product) => Promise<void>;
};

const emptyProduct: Product = { id: 0, name: '', brand: '', model: '', category: null };
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const userProductStore = create<State>((set, get) => ({
  product: [],
  showProduct: emptyProduct,

  setProduct: (data) => set({ product: data }),
  clearShowProduct: () => set({ showProduct: emptyProduct }),

  // silent=true: usado por el refresco en vivo (WebSocket) para no interrumpir
  // al usuario con el loader de pantalla completa por cambios de otros clientes.
  fetchProduct: async (silent = false) => {
    const { showLoader, hideLoader } = useLoaderStore.getState();
    if (!silent) showLoader();
    try {
      const res = await fetch(`${API_BASE_URL}/product`);
      if (!res.ok) throw new Error('Error al obtener productos');
      const data = await res.json();
      set({ product: data });
    } catch {
      if (!silent) useToastStore.getState().showToast('Error al cargar productos', 'error');
    } finally {
      if (!silent) hideLoader();
    }
  },

  saveProduct: async (data: Product): Promise<boolean> => {
    try {
      const payload = { ...data, categoryId: data.category?.id ?? null };
      await fetch(`${API_BASE_URL}/product/dto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await get().fetchProduct();
      get().clearShowProduct();
      useToastStore.getState().showToast('Producto guardado correctamente', 'success');
      return true;
    } catch (error) {
      useToastStore.getState().showToast('Error al guardar producto: ' + error, 'error');
      return false;
    }
  },

  deleteProduct: async (data: Product) => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/inventory/id/${data.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      await get().fetchProduct();
      useToastStore.getState().showToast('Producto eliminado correctamente', 'success');
    } catch (error) {
      useToastStore.getState().showToast('Error al eliminar producto: ' + error, 'error');
    }
  },
}));
