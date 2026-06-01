'use client';

import React from 'react';

interface SystemsProps {
  imagePreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export default function Systems({ imagePreview, onFileChange, onClose }: SystemsProps) {
  return (
    <div className="relative p-4 max-w-xs mx-auto bg-white rounded-md shadow-md">
      {/* Botón de cierre */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        aria-label="Cerrar configuración"
      >
        &times;
      </button>

      {/* Imagen y selector */}
      <div className="flex flex-col items-center gap-4">
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt="Vista previa"
            className="w-24 h-24 rounded-full object-cover border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border text-sm text-center">
            Sin imagen
          </div>
        )}

        {/* Input con estilo mejorado */}
        <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
          Cambiar imagen
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}