'use client';

import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/app/model/InventoryItem';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { userProductStore } from '@/app/store/userProductStore';

type Props = {
  initialData: InventoryItem;
  onSave?: (data: InventoryItem) => void;
};

type Errors = Partial<Record<keyof InventoryItem | 'productId', string>>;

const Field = ({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
      {label} {required && <span className="text-red-400 normal-case">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
    err ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
  }`;

export default function InventoryEditor({ initialData, onSave }: Props) {
  const [item, setItem] = useState<InventoryItem>(initialData);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [productMode, setProductMode] = useState<'select' | 'new'>(
    initialData.product.id ? 'select' : 'new'
  );

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

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    const ok = await saveInventory(item);
    setLoading(false);
    if (ok) onSave?.(item);
  };

  return (
    <div className="space-y-5">
      {/* DATOS DE INVENTARIO */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
          Datos del Registro
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad" required error={errors.quantity}>
            <input
              type="number"
              name="quantity"
              value={item.quantity}
              onChange={handleChange}
              min={0}
              className={inputCls(errors.quantity)}
              placeholder="0"
            />
          </Field>

          <Field label="Precio" required error={errors.price}>
            <input
              type="number"
              name="price"
              value={item.price}
              onChange={handleChange}
              min={0}
              step="0.01"
              className={inputCls(errors.price)}
              placeholder="0.00"
            />
          </Field>

          <Field label="Código de Barras" required error={errors.barcode}>
            <input
              type="text"
              name="barcode"
              value={item.barcode}
              onChange={handleChange}
              className={inputCls(errors.barcode) + ' font-mono'}
              placeholder="Ej: 7501234567890"
            />
          </Field>

          <Field label="Fecha de Ingreso" required error={errors.arrivalDate}>
            <input
              type="date"
              name="arrivalDate"
              value={item.arrivalDate}
              onChange={handleChange}
              className={inputCls(errors.arrivalDate)}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Descripción" error={errors.description}>
            <textarea
              name="description"
              value={item.description}
              onChange={handleChange}
              rows={2}
              className={inputCls(errors.description) + ' resize-none'}
              placeholder="Estado del empaque, detalles adicionales..."
            />
          </Field>
        </div>
      </div>

      {/* PRODUCTO */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700">Producto Asociado</h3>
          <div className="flex gap-1">
            {(['select', 'new'] as const).map(m => (
              <button
                key={m}
                onClick={() => setProductMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  productMode === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m === 'select' ? 'Existente' : 'Nuevo'}
              </button>
            ))}
          </div>
        </div>

        {productMode === 'select' ? (
          <Field label="Seleccionar Producto" required error={errors.productId}>
            <select
              value={item.product.id}
              onChange={handleSelectProduct}
              className={inputCls(errors.productId)}
            >
              <option value={0}>— Selecciona un producto —</option>
              {product.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.brand} · {p.model}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="Nombre" required error={errors.description}>
                <input
                  type="text"
                  name="name"
                  value={item.product.name}
                  onChange={handleProductField}
                  className={inputCls(errors.description)}
                  placeholder="Nombre del producto"
                />
              </Field>
            </div>
            <Field label="Marca">
              <input
                type="text"
                name="brand"
                value={item.product.brand}
                onChange={handleProductField}
                className={inputCls()}
                placeholder="Marca"
              />
            </Field>
            <Field label="Modelo">
              <input
                type="text"
                name="model"
                value={item.product.model}
                onChange={handleProductField}
                className={inputCls()}
                placeholder="Modelo"
              />
            </Field>
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
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
            Guardar Registro
          </>
        )}
      </button>
    </div>
  );
}
