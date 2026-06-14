'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AppLogoProps {
  size?: number;
  className?: string;
}

export default function AppLogo({ size = 40, className = '' }: AppLogoProps) {
  const [failed, setFailed] = useState(false);

  const logoSrc = process.env.NEXT_PUBLIC_LOGO || '/logo/logo.png';

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
