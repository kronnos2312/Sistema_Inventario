'use client';
import Image from 'next/image';
import { useLogo } from '@/app/hooks/useLogo';
import { useLoaderStore } from '@/app/store/useLoaderStore';

export default function Loader() {
  const loading = useLoaderStore((state) => state.loading);
  const logoSrc = useLogo();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40">
        <Image
            key={logoSrc}
            src={logoSrc}
            alt="Cargando..."
            width={80}
            height={80}
            priority
        />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
    </div>
  );
}
