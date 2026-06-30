'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/app/model/Product';
import { userProductStore } from '@/app/store/userProductStore';
import { useCategoryStore } from '@/app/store/useCategoryStore';

type Props = {
  initialData: Product;
  onSave?: (data: Product) => void;
  onCancel?: () => void;
};

type Errors = Partial<Record<keyof Product, string>>;

const inputCls = (err?: string) =>
  `w-full px-4 py-2.5 border rounded-xl text-sm placeholder:text-slate-400 transition-all duration-150 focus:outline-none focus:ring-2 ${
    err
      ? 'border-red-400 bg-red-50/50 focus:ring-red-400/25 focus:border-red-400'
      : 'border-slate-200 bg-white hover:border-slate-300 focus:ring-indigo-500/25 focus:border-indigo-500'
  }`;

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="flex items-center gap-1 text-sm font-medium text-slate-700 mb-1.5">
    {children}
    {required && <span className="text-red-400 text-xs leading-none">*</span>}
  </label>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </p>
  ) : null;

export default function ProductEditor({ initialData, onSave, onCancel }: Props) {
  const [item, setItem] = useState<Product>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const saveProduct = userProductStore(state => state.saveProduct);
  const { categories, fetchCategories, createCategory } = useCategoryStore();

  // Inline nueva categoría
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      setShowNewCat(true);
      return;
    }
    if (val === '') {
      setItem(prev => ({ ...prev, category: null }));
      return;
    }
    const found = categories.find(c => String(c.id) === val);
    setItem(prev => ({ ...prev, category: found ?? null }));
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    const created = await createCategory(newCatName.trim());
    setCreatingCat(false);
    if (created) {
      setItem(prev => ({ ...prev, category: created }));
      setShowNewCat(false);
      setNewCatName('');
    }
  };

  const cancelNewCat = () => {
    setShowNewCat(false);
    setNewCatName('');
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
    <div className="flex flex-col gap-4">

      {/* Nombre */}
      <div>
        <Label required>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Nombre del producto
        </Label>
        <input
          name="name"
          value={item.name}
          onChange={handleChange}
          placeholder="Ej: Mouse inalámbrico ergonómico"
          className={inputCls(errors.name)}
          autoFocus
        />
        <FieldError msg={errors.name} />
      </div>

      {/* Marca */}
      <div>
        <Label required>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Marca
        </Label>
        <input
          name="brand"
          value={item.brand}
          onChange={handleChange}
          placeholder="Ej: Logitech, ASUS, Samsung"
          className={inputCls(errors.brand)}
        />
        <FieldError msg={errors.brand} />
      </div>

      {/* Modelo */}
      <div>
        <Label>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
          Modelo
          <span className="ml-1 text-xs text-slate-400 font-normal normal-case">(opcional)</span>
        </Label>
        <input
          name="model"
          value={item.model}
          onChange={handleChange}
          placeholder="Ej: MX Master 3S, TUF F15"
          className={inputCls()}
        />
      </div>

      {/* Categoría */}
      <div>
        <Label>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Categoría
          <span className="ml-1 text-xs text-slate-400 font-normal normal-case">(opcional)</span>
        </Label>

        {!showNewCat ? (
          <div className="flex gap-2">
            <select
              value={item.category ? String(item.category.id) : ''}
              onChange={handleCategoryChange}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
            >
              <option value="">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
              <option value="__new__">＋ Nueva categoría...</option>
            </select>
            {item.category && (
              <button
                type="button"
                onClick={() => setItem(prev => ({ ...prev, category: null }))}
                title="Quitar categoría"
                className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-200 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); if (e.key === 'Escape') cancelNewCat(); }}
              placeholder="Nombre de la nueva categoría"
              className="flex-1 px-4 py-2.5 border border-indigo-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateCategory}
              disabled={!newCatName.trim() || creatingCat}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-xl transition"
            >
              {creatingCat ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Crear
            </button>
            <button
              type="button"
              onClick={cancelNewCat}
              className="shrink-0 px-3 py-2.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 text-xs font-medium transition"
            >
              Cancelar
            </button>
          </div>
        )}

        {item.category && !showNewCat && (
          <p className="mt-1.5 text-xs text-indigo-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Categoría: <strong>{item.category.name}</strong>
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 pt-3 mt-1 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item.id ? 'Guardar cambios' : 'Crear producto'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
