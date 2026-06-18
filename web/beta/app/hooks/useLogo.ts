'use client';

import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 30_000;

async function fetchLogoUrl(): Promise<string | null> {
  try {
    const res = await fetch('/api-proxy/files/config/logo', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ?? null;
  } catch {
    return null;
  }
}

export function useLogo(): string {
  const [logo, setLogo] = useState(process.env.NEXT_PUBLIC_LOGO || '/logo/logo.png');
  const logoRef = useRef(logo);

  useEffect(() => {
    const runtime = (window as unknown as Record<string, string>).__LOGO_URL__;
    if (runtime) {
      setLogo(runtime);
      logoRef.current = runtime;
    }

    const handler = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      if (url) {
        setLogo(url);
        logoRef.current = url;
      }
    };
    window.addEventListener('logo-updated', handler);

    const poll = setInterval(async () => {
      const url = await fetchLogoUrl();
      if (url && url !== logoRef.current) {
        setLogo(url);
        logoRef.current = url;
      }
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('logo-updated', handler);
      clearInterval(poll);
    };
  }, []);

  return logo;
}
