'use client';

import { useLiveSync } from '@/app/hooks/useLiveSync';

/** Sin UI propia: solo mantiene abierta la conexión de refresco en vivo. */
export default function LiveSync() {
  useLiveSync();
  return null;
}
