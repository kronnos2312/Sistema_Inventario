'use client';

import React, { useRef, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';

interface CartItem {
  barcode: string;
  productName: string;
  productBrand: string;
  productModel: string;
  price: number;
}

type Props = {
  onClose: () => void;
};

const fmt = (v: number) => `$${v.toLocaleString('es-CO')}`;
const today = () => new Date().toISOString().split('T')[0];

export default function MultiWithdrawalPanel({ onClose }: Props) {
  const { inventory, bulkOutInventory } = useInventoryStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [date, setDate] = useState(today);
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const total = cart.reduce((sum, i) => sum + i.price, 0);

  const addItem = () => {
    const code = barcodeInput.trim();
    if (!code) { setInputError('Ingresa un código de barras'); return; }

    if (cart.some(c => c.barcode === code)) {
      setInputError('Este artículo ya está en la lista');
      return;
    }

    const found = inventory.find(i => i.barcode === code && !i.outDate);
    if (!found) {
      const retired = inventory.find(i => i.barcode === code && !!i.outDate);
      setInputError(retired ? 'Este artículo ya fue retirado anteriormente' : 'Código no encontrado en inventario activo');
      return;
    }

    setCart(prev => [
      ...prev,
      {
        barcode: found.barcode,
        productName: found.product.name,
        productBrand: found.product.brand,
        productModel: found.product.model,
        price: Number(found.price),
      },
    ]);
    setBarcodeInput('');
    setInputError('');
    inputRef.current?.focus();
  };

  const removeItem = (barcode: string) => {
    setCart(prev => prev.filter(i => i.barcode !== barcode));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addItem();
  };

  const handleWithdraw = async () => {
    if (cart.length === 0) return;
    if (!date) { setInputError('Selecciona la fecha de retiro'); return; }
    setLoading(true);
    await bulkOutInventory(cart.map(i => ({ barCode: i.barcode, dateOut: date })));
    setLoading(false);
    setCart([]);
    onClose();
  };

  return (
    <div className="panel-enter bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden mb-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Retiro Múltiple</p>
            <p className="text-xs text-white/70 leading-tight">
              {cart.length === 0
                ? 'Agrega artículos por código de barras'
                : `${cart.length} artículo${cart.length !== 1 ? 's' : ''} en lista`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/25 transition"
          aria-label="Cerrar panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Fecha + Input barcode ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Fecha */}
          <div className="sm:w-52">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Fecha de retiro
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition"
            />
          </div>

          {/* Barcode input */}
          <div className="flex-1">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Código de barras
              <span className="ml-auto font-normal normal-case text-slate-400">Enter para agregar</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={barcodeInput}
                onChange={e => { setBarcodeInput(e.target.value); setInputError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Escanea o escribe el código..."
                className={`flex-1 px-4 py-2.5 border rounded-xl text-sm font-mono placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 transition ${
                  inputError
                    ? 'border-red-400 bg-red-50/50 focus:ring-red-400/25'
                    : 'border-slate-200 hover:border-slate-300 focus:ring-indigo-500/25 focus:border-indigo-500'
                }`}
                autoFocus
              />
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-indigo-200 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </button>
            </div>
            {inputError && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {inputError}
              </p>
            )}
          </div>
        </div>

        {/* ── Lista de artículos ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Artículos a retirar
            </p>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-slate-400 hover:text-red-500 transition"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 flex flex-col items-center gap-2 text-slate-400">
              <svg className="w-9 h-9 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">Lista vacía</p>
              <p className="text-xs">Agrega artículos usando el código de barras</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {cart.map((item, idx) => (
                <div
                  key={item.barcode}
                  className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors group"
                >
                  {/* Número */}
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Info producto */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.productName || '—'}
                      {item.productBrand && (
                        <span className="ml-1.5 text-xs font-normal text-slate-500">
                          · {item.productBrand}
                          {item.productModel && ` · ${item.productModel}`}
                        </span>
                      )}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{item.barcode}</p>
                  </div>

                  {/* Precio */}
                  <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                    {fmt(item.price)}
                  </span>

                  {/* Eliminar */}
                  <button
                    onClick={() => removeItem(item.barcode)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    aria-label="Quitar artículo"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Total + acciones ── */}
        {cart.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total estimado</p>
              <p className="text-xl font-extrabold text-slate-800">{fmt(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Artículos</p>
              <p className="text-xl font-extrabold text-indigo-600">{cart.length}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading || cart.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
                Procesar {cart.length > 0 ? `${cart.length} retiro${cart.length !== 1 ? 's' : ''}` : 'retiros'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
