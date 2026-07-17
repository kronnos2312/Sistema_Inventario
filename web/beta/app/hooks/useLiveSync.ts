'use client';

import { useEffect } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { userProductStore } from '@/app/store/userProductStore';
import { useCategoryStore } from '@/app/store/useCategoryStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT;
const RECONNECT_DELAY_MS = 5000;

function resolveWsUrl(): string | null {
  if (typeof window === 'undefined') return null;

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    const url = new URL(API_BASE_URL);
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${url.host}/ws/updates`;
  }

  // API_BASE_URL relativo (p.ej. /api-proxy en Docker): el rewrite de Next.js
  // no soporta el handshake de upgrade de WebSocket, así que el navegador se
  // conecta directo al backend — mismo host, puerto propio (igual que Android).
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const port = BACKEND_PORT || window.location.port;
  return `${wsProtocol}//${window.location.hostname}:${port}/ws/updates`;
}

/**
 * Mantiene la web al día cuando otro cliente (por ejemplo la app Android)
 * crea o edita inventario/productos/categorías, sin necesidad de recargar.
 */
export function useLiveSync() {
  useEffect(() => {
    const url = resolveWsUrl();
    if (!url) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      socket = new WebSocket(url);

      socket.onmessage = (event) => {
        switch (event.data) {
          case 'INVENTORY':
            useInventoryStore.getState().fetchInventory(true);
            break;
          case 'PRODUCT':
            userProductStore.getState().fetchProduct(true);
            break;
          case 'CATEGORY':
            useCategoryStore.getState().fetchCategories();
            break;
        }
      };

      socket.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
