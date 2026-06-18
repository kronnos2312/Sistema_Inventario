'use client';

import { useState, useRef, useEffect } from 'react';
import Systems from './Systems';
import Image from 'next/image';
import { useLogo } from '@/app/hooks/useLogo';

export default function UserDropdown() {
  const logoSrc = useLogo();
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/*
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-lg hover:bg-gray-300 transition"
        aria-label="Abrir menú de usuario">
        ⚙️
      </button>
      */}
      <Image
        key={logoSrc}
        src={logoSrc}
        alt="Cargando..."
        width={80}
        height={80}
        priority
      />

      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white shadow-md border rounded-md text-sm z-50">
          <div className="px-4 py-2 text-gray-800 font-semibold border-b">Preferencias</div>
          <button
            onClick={() => {
              setShowSettings(true);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
          >
            Configuración
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-gray-400 cursor-not-allowed"
            disabled
          >
            Próximamente
          </button>
        </div>
      )}

      {/* Modal de configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-md shadow-lg p-6 w-full max-w-sm relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Configuración de Usuario
            </h2>
            <Systems
              imagePreview={imagePreview}
              onFileChange={handleFileChange}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}