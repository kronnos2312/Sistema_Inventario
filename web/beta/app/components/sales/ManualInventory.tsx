'use client';

import React, { useState } from 'react';
import { WInventory } from '@/app/model/WithdrawInventory';
import { useInventoryStore } from '@/app/store/useInventoryStore';

type Props = {
  initialData: WInventory;
  onSend?: () => void;
};

export default function ManualInventory({ initialData, onSend }: Props) {
  const [item, setItem] = useState<WInventory>(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<WInventory>>({});
  const getOutInventory = useInventoryStore(state => state.getOutInventory);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs: Partial<WInventory> = {};
    if (!item.barCode.trim()) errs.barCode = 'El código de barras es requerido';
    if (!item.dateOut) errs.dateOut = 'La fecha de salida es requerida';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    await getOutInventory(item);
    setLoading(false);
    onSend?.();
  };

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-amber-700">
          Registra la salida de un artículo ingresando su código de barras y la fecha de retiro.
          Esta acción marcará el artículo como retirado del inventario.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Fecha de Salida <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="dateOut"
          value={item.dateOut}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.dateOut ? 'border-red-400 bg-red-50' : 'border-slate-300'
          }`}
        />
        {errors.dateOut && (
          <p className="mt-1 text-xs text-red-500">{errors.dateOut}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Código de Barras <span className="text-red-500">*</span>
        </label>
        <input
          name="barCode"
          value={item.barCode}
          onChange={handleChange}
          placeholder="Escanea o ingresa el código"
          className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.barCode ? 'border-red-400 bg-red-50' : 'border-slate-300'
          }`}
        />
        {errors.barCode && (
          <p className="mt-1 text-xs text-red-500">{errors.barCode}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Procesando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
            Registrar Retiro
          </>
        )}
      </button>
    </div>
  );
}
