'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLogo } from '@/app/hooks/useLogo';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export default function AppLogo({ size = 40, className = '' }: AppLogoProps) {
  const logoSrc = useLogo();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [logoSrc]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-200 rounded-lg text-slate-500 font-bold select-none ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
        title="Logo no disponible"
      >
        ?
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        key={logoSrc}
        src={logoSrc}
        alt="Logo"
        fill
        className="object-contain"
        onError={() => setFailed(true)}
        priority
      />
    </div>
  );
}
