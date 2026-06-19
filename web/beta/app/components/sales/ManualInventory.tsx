'use client';

import React, { useState } from 'react';
import { WInventory } from '@/app/model/WithdrawInventory';
import { useInventoryStore } from '@/app/store/useInventoryStore';

type Props = {
  initialData: WInventory;
  onSend?: () => void;
  onCancel?: () => void;
};

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

export default function ManualInventory({ initialData, onSend, onCancel }: Props) {
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
    <div className="flex flex-col gap-4">

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-800 mb-0.5">Registrar retiro de inventario</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Ingresa el código de barras del artículo y la fecha de salida. Esta acción lo marcará como retirado del inventario.
          </p>
        </div>
      </div>

      {/* Fecha de salida */}
      <div>
        <Label required>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Fecha de salida
        </Label>
        <input
          type="date"
          name="dateOut"
          value={item.dateOut}
          onChange={handleChange}
          className={inputCls(errors.dateOut)}
        />
        <FieldError msg={errors.dateOut} />
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
          name="barCode"
          value={item.barCode}
          onChange={handleChange}
          placeholder="Escanea o ingresa el código"
          autoFocus
          className={`${inputCls(errors.barCode)} font-mono tracking-wide`}
        />
        <FieldError msg={errors.barCode} />
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-white flex gap-3 pt-3 pb-1 border-t border-slate-100 -mx-4 px-4 z-10">
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
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition shadow-sm shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Registrar retiro
            </>
          )}
        </button>
      </div>
    </div>
  );
}
