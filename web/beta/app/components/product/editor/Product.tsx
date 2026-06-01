'use client';

import React, { useState } from 'react';
import { Product } from '@/app/model/Product';
import { userProductStore } from '@/app/store/userProductStore';

type Props = {
  initialData: Product;
  onSave?: (data: Product) => void;
};

type Errors = Partial<Record<keyof Product, string>>;

const inputCls = (err?: string) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    err ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
  }`;

export default function ProductEditor({ initialData, onSave }: Props) {
  const [item, setItem] = useState<Product>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const saveProduct = userProductStore(state => state.saveProduct);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!item.name.trim()) errs.name = 'El nombre es requerido';
    if (!item.brand.trim()) errs.brand = 'La marca es requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const ok = await saveProduct(item);
    setLoading(false);
    if (ok) onSave?.(item);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Nombre <span className="text-red-400 normal-case">*</span>
        </label>
        <input
          name="name"
          value={item.name}
          onChange={handleChange}
          className={inputCls(errors.name)}
          placeholder="Nombre del producto"
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Marca <span className="text-red-400 normal-case">*</span>
        </label>
        <input
          name="brand"
          value={item.brand}
          onChange={handleChange}
          className={inputCls(errors.brand)}
          placeholder="Ej: ASUS, Logitech, Samsung"
        />
        {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Modelo
        </label>
        <input
          name="model"
          value={item.model}
          onChange={handleChange}
          className={inputCls()}
          placeholder="Ej: TUF F15, MX Master 3S"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition mt-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {item.id ? 'Guardar Cambios' : 'Crear Producto'}
          </>
        )}
      </button>
    </div>
  );
}
