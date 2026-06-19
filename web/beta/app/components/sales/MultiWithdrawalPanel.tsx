'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';

interface CartItem {
  barcode: string;
  productName: string;
  productBrand: string;
  productModel: string;
  price: number;
  availableQty: number;
  withdrawQty: number;
}

type Props = { onClose: () => void };

const fmt = (v: number) => `$${v.toLocaleString('es-CO')}`;
const today = () => new Date().toISOString().split('T')[0];

export default function MultiWithdrawalPanel({ onClose }: Props) {
  const { inventory, bulkOutInventory } = useInventoryStore();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Bloquear scroll del body cuando el panel móvil está abierto
  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile]);

  const total = cart.reduce((sum, i) => sum + i.price * i.withdrawQty, 0);
  const totalUnits = cart.reduce((sum, i) => sum + i.withdrawQty, 0);

  const addItem = () => {
    const code = barcodeInput.trim();
    if (!code) { setInputError('Ingresa un código de barras'); return; }
    if (cart.some(c => c.barcode === code)) { setInputError('Este artículo ya está en la lista'); return; }
    const found = inventory.find(i => i.barcode === code && !i.outDate);
    if (!found) {
      const retired = inventory.find(i => i.barcode === code && !!i.outDate);
      setInputError(retired ? 'Este artículo ya fue retirado anteriormente' : 'Código no encontrado en inventario activo');
      return;
    }
    const qty = Number(found.quantity) || 1;
    setCart(prev => [...prev, {
      barcode: found.barcode,
      productName: found.product.name,
      productBrand: found.product.brand,
      productModel: found.product.model,
      price: Number(found.price),
      availableQty: qty,
      withdrawQty: qty,
    }]);
    setBarcodeInput('');
    setInputError('');
    inputRef.current?.focus();
  };

  const removeItem = (barcode: string) => setCart(prev => prev.filter(i => i.barcode !== barcode));

  const updateQty = (barcode: string, delta: number) => {
    setCart(prev => prev.map(item =>
      item.barcode === barcode
        ? { ...item, withdrawQty: Math.min(Math.max(1, item.withdrawQty + delta), item.availableQty) }
        : item
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addItem();
  };

  const handleWithdraw = async () => {
    if (cart.length === 0) return;
    if (!date) { setInputError('Selecciona la fecha de retiro'); return; }
    setLoading(true);
    await bulkOutInventory(cart.map(i => ({
      barCode: i.barcode,
      dateOut: date,
      description: description.trim() || undefined,
      withdrawQuantity: i.withdrawQty,
    })));
    setLoading(false);
    setCart([]);
    setDescription('');
    onClose();
  };

  /* ── Contenido compartido móvil/desktop ── */
  const panelBody = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Retiro Múltiple</p>
            <p className="text-xs text-white/70 leading-tight truncate">
              {cart.length === 0
                ? 'Agrega artículos por código'
                : `${cart.length} artículo${cart.length !== 1 ? 's' : ''} · ${totalUnits} unidad${totalUnits !== 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/25 transition"
          aria-label="Cerrar panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Cuerpo scrolleable */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-2 space-y-4">

        {/* Fecha + Código */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-48 flex-shrink-0">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Fecha de retiro</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <span>Código de barras</span>
              <span className="font-normal normal-case text-slate-400">Enter para agregar</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={barcodeInput}
                onChange={e => { setBarcodeInput(e.target.value); setInputError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Escanea o escribe..."
                className={`flex-1 min-w-0 px-3.5 py-2.5 border rounded-xl text-sm font-mono placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 transition ${
                  inputError
                    ? 'border-red-400 bg-red-50/50 focus:ring-red-400/25'
                    : 'border-slate-200 hover:border-slate-300 focus:ring-indigo-500/25 focus:border-indigo-500'
                }`}
                autoFocus
              />
              <button
                onClick={addItem}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-sm touch-manipulation"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden xs:inline sm:hidden md:inline">Agregar</span>
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

        {/* Nota del retiro */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            <span>Nota del retiro</span>
            <span className="font-normal normal-case text-slate-400">Opcional</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Motivo (venta, traslado, daño, etc.)..."
            rows={2}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition resize-none placeholder:text-slate-400"
          />
        </div>

        {/* Lista */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Artículos a retirar
            </p>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-slate-400 hover:text-red-500 transition touch-manipulation">
                Limpiar todo
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400">
              <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium">Lista vacía</p>
              <p className="text-xs">Agrega artículos usando el código de barras</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {cart.map((item, idx) => (
                <div key={item.barcode} className="bg-white hover:bg-slate-50 transition-colors px-3 py-3">
                  {/* Fila superior: badge + nombre + precio + eliminar */}
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
                        {item.productName || '—'}
                      </p>
                      {(item.productBrand || item.productModel) && (
                        <p className="text-xs text-slate-400 leading-tight truncate">
                          {[item.productBrand, item.productModel].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5 truncate">{item.barcode}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-bold text-slate-800 mt-0.5">
                      {fmt(item.price * item.withdrawQty)}
                    </span>
                    <button
                      onClick={() => removeItem(item.barcode)}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition touch-manipulation"
                      aria-label="Quitar artículo"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Fila inferior: stepper de cantidad (solo si hay más de 1 unidad) */}
                  {item.availableQty > 1 && (
                    <div className="flex items-center gap-2 mt-2 pl-7">
                      <span className="text-xs text-slate-400">Cantidad:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.barcode, -1)}
                          disabled={item.withdrawQty <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition touch-manipulation"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-800 tabular-nums">
                          {item.withdrawQty}
                        </span>
                        <button
                          onClick={() => updateQty(item.barcode, +1)}
                          disabled={item.withdrawQty >= item.availableQty}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 transition touch-manipulation"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                      <span className="text-xs text-slate-400">de {item.availableQty}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totales */}
        {cart.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total estimado</p>
              <p className="text-xl font-extrabold text-slate-800">{fmt(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Unidades</p>
              <p className="text-xl font-extrabold text-indigo-600">{totalUnits}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky */}
      <div className="flex-shrink-0 flex gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50 touch-manipulation"
        >
          Cancelar
        </button>
        <button
          onClick={handleWithdraw}
          disabled={loading || cart.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-sm shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
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
              {cart.length > 0
                ? `Procesar ${cart.length} retiro${cart.length !== 1 ? 's' : ''}`
                : 'Procesar retiros'}
            </>
          )}
        </button>
      </div>
    </>
  );

  /* ── Móvil: bottom sheet fijo ── */
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[900] bg-slate-900/50 backdrop-blur-[2px] flex items-end"
        onClick={onClose}
      >
        <div
          className="w-full max-h-[92dvh] flex flex-col bg-white rounded-t-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
          {panelBody}
        </div>
      </div>
    );
  }

  /* ── Desktop: panel inline ── */
  return (
    <div className="panel-enter bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col max-h-[80vh] mb-6">
      {panelBody}
    </div>
  );
}
