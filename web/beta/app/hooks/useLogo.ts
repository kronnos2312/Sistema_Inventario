'use client';

import { useState, useEffect } from 'react';

export function useLogo(): string {
  const [logo, setLogo] = useState(process.env.NEXT_PUBLIC_LOGO || '/logo/logo.png');

  useEffect(() => {
    const runtime = (window as unknown as Record<string, string>).__LOGO_URL__;
    if (runtime) setLogo(runtime);
  }, []);

  return logo;
}
