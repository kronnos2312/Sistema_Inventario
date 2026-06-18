'use client';

import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '@/app/model/InventoryItem';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { userProductStore } from '@/app/store/userProductStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type PreviewImage = { code: string; objectUrl: string };

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch(`${API_BASE_URL}/files/upload`, { method: 'POST', body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.code ?? null;
  } catch {
    return null;
  }
}

type Props = {
  initialData: InventoryItem;
  onSave?: (data: InventoryItem) => void;
  onCancel?: () => void;
};

type Errors = Partial<Record<keyof InventoryItem | 'productId', string>>;

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

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    <div className="flex-1 h-px bg-slate-100 ml-1" />
  </div>
);

export default function InventoryEditor({ initialData, onSave, onCancel }: Props) {
  const [item, setItem] = useState<InventoryItem>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [productMode, setProductMode] = useState<'select' | 'new'>(
    initialData.product.id ? 'select' : 'new'
  );

  const [previews, setPreviews] = useState<PreviewImage[]>(() =>
    (initialData.images ?? []).map(img => ({
      code: img.code,
      objectUrl: `${API_BASE_URL}/files/${img.code}`,
    }))
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveInventory = useInventoryStore(state => state.saveInventory);
  const { product, fetchProduct } = userProductStore();

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProductField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, product: { ...prev.product, [name]: value } }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectProduct = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const found = product.find(p => p.id === id);
    if (found) {
      setItem(prev => ({ ...prev, product: found }));
      setErrors(prev => ({ ...prev, productId: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Errors = {};
    if (!item.barcode.trim()) errs.barcode = 'El código de barras es requerido';
    if (!item.quantity && item.quantity !== 0) errs.quantity = 'La cantidad es requerida';
    if (!item.price && item.price !== 0) errs.price = 'El precio es requerido';
    if (Number(item.price) < 0) errs.price = 'El precio no puede ser negativo';
    if (!item.arrivalDate) errs.arrivalDate = 'La fecha de ingreso es requerida';
    if (productMode === 'select' && !item.product.id) errs.productId = 'Selecciona un producto';
    if (productMode === 'new' && !item.product.name.trim()) errs.description = 'El nombre del producto es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const objectUrl = URL.createObjectURL(file);
      const code = await uploadImage(file);
      if (code) {
        setPreviews(prev => [...prev, { code, objectUrl }]);
      } else {
        URL.revokeObjectURL(objectUrl);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (code: string) => {
    setPreviews(prev => {
      const removed = prev.find(p => p.code === code);
      if (removed && removed.objectUrl.startsWith('blob:')) URL.revokeObjectURL(removed.objectUrl);
      return prev.filter(p => p.code !== code);
    });
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const ok = await saveInventory({ ...item, imageCodes: previews.map(p => p.code) });
    setLoading(false);
    if (ok) onSave?.(item);
  };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Sección 1: Datos del registro ── */}
      <div>
        <SectionHeader
          title="Datos del registro"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Cantidad */}
          <div>
            <Label required>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Cantidad
            </Label>
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={handleChange}
              min={0}
              placeholder="0"
              className={inputCls(errors.quantity)}
            />
            <FieldError msg={errors.quantity} />
          </div>

          {/* Precio */}
          <div>
            <Label required>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Precio
            </Label>
            <input
              type="number"
              name="price"
              value={item.price}
              onChange={handleChange}
              min={0}
              step="0.01"
              placeholder="0.00"
              className={inputCls(errors.price)}
            />
            <FieldError msg={errors.price} />
          </div>

          {/* Código de barras */}
          <div>
            <Label required>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Código de barras
            </Label>
            <input
              type="text"
              name="barcode"
              value={item.barcode}
              onChange={handleChange}
              placeholder="Ej: 7501234567890"
              className={`${inputCls(errors.barcode)} font-mono`}
            />
            <FieldError msg={errors.barcode} />
          </div>

          {/* Fecha de ingreso */}
          <div>
            <Label required>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Fecha de ingreso
            </Label>
            <input
              type="date"
              name="arrivalDate"
              value={item.arrivalDate}
              onChange={handleChange}
              className={inputCls(errors.arrivalDate)}
            />
            <FieldError msg={errors.arrivalDate} />
          </div>
        </div>

        {/* Descripción */}
        <div className="mt-3">
          <Label>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12M4 18h8" />
            </svg>
            Descripción
            <span className="ml-1 text-xs text-slate-400 font-normal">(opcional)</span>
          </Label>
          <textarea
            name="description"
            value={item.description}
            onChange={handleChange}
            rows={2}
            placeholder="Estado del empaque, detalles adicionales..."
            className={`${inputCls(errors.description)} resize-none`}
          />
        </div>
      </div>

      {/* ── Sección 2: Imágenes ── */}
      <div>
        <SectionHeader
          title="Imágenes"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Miniaturas */}
        {previews.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {previews.map(p => (
              <div key={p.code} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.objectUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(p.code)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input oculto + botones */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex gap-2">
          {/* Cámara (mobile: capture=environment) */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cámara
          </button>

          {/* Galería / archivo */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            {uploading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            {uploading ? 'Subiendo...' : 'Galería / Archivo'}
          </button>
        </div>
      </div>

      {/* ── Sección 3: Producto asociado ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Producto asociado</h3>
          <div className="flex-1 h-px bg-slate-100 mx-1" />
          {/* Toggle select/new */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden p-0.5 bg-slate-50">
            {(['select', 'new'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setProductMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  productMode === m
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'select' ? 'Existente' : 'Nuevo'}
              </button>
            ))}
          </div>
        </div>

        {productMode === 'select' ? (
          <div>
            <Label required>Seleccionar producto</Label>
            <select
              value={item.product.id}
              onChange={handleSelectProduct}
              className={`${inputCls(errors.productId)} pr-9 bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2020%2020'%20fill%3D'%236b7280'%3E%3Cpath%20fill-rule%3D'evenodd'%20d%3D'M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z'%20clip-rule%3D'evenodd'%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem] appearance-none`}
            >
              <option value={0}>— Selecciona un producto —</option>
              {product.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.brand} {p.model ? `· ${p.model}` : ''}
                </option>
              ))}
            </select>
            <FieldError msg={errors.productId} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label required>Nombre</Label>
              <input
                type="text"
                name="name"
                value={item.product.name}
                onChange={handleProductField}
                placeholder="Nombre del producto"
                className={inputCls(errors.description)}
                autoFocus={productMode === 'new'}
              />
              <FieldError msg={errors.description} />
            </div>
            <div>
              <Label>Marca</Label>
              <input
                type="text"
                name="brand"
                value={item.product.brand}
                onChange={handleProductField}
                placeholder="Ej: ASUS"
                className={inputCls()}
              />
            </div>
            <div>
              <Label>Modelo</Label>
              <input
                type="text"
                name="model"
                value={item.product.model}
                onChange={handleProductField}
                placeholder="Ej: TUF F15"
                className={inputCls()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-3 border-t border-slate-100">
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
              Guardar registro
            </>
          )}
        </button>
      </div>
    </div>
  );
}
