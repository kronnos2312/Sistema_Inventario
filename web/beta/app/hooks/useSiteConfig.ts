'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __SITE_TITLE__?: string;
    __SITE_CLIENT__?: string;
  }
}

export function useSiteConfig() {
  const [title, setTitle] = useState(process.env.NEXT_PUBLIC_SITE_TITLE || 'Sistema de Inventario');
  const [client, setClient] = useState(process.env.NEXT_PUBLIC_SITE_CLIENT || '');

  useEffect(() => {
    if (window.__SITE_TITLE__) setTitle(window.__SITE_TITLE__);
    if (window.__SITE_CLIENT__) setClient(window.__SITE_CLIENT__);
  }, []);

  return { title, client };
}
