'use client';

import React, { useEffect, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import MultiWithdrawalPanel from './MultiWithdrawalPanel';
import BarcodeScanner from './BarcodeScanner';

type SortKey = 'barcode' | 'product' | 'brand' | 'price' | 'arrivalDate' | 'outDate';
type SortDir = 'asc' | 'desc';

const fmt = (d: string) => (d ? d.split('T')[0] : '—');
const fmtCurrency = (v: number | '') =>
  v !== '' ? `$${Number(v).toLocaleString('es-CO')}` : '—';

export default function SalesPage() {
  const { inventory, fetchInventory } = useInventoryStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { setCurrentPage(1); }, [search, itemsPerPage]);

  const inStock = inventory.filter(i => !i.outDate);
  const retired = inventory.filter(i => !!i.outDate);
  const stockVal = inStock
    .filter(i => Number(i.quantity) > 0)
    .reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const retVal = retired.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);

  const filtered = retired.filter(i =>
    `${i.barcode} ${i.product.name} ${i.product.brand} ${i.product.model} ${i.description} ${i.withdrawalNote ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    type Val = string | number;
    const map: Record<SortKey, [Val, Val]> = {
      barcode: [a.barcode, b.barcode],
      product: [a.product.name, b.product.name],
      brand: [a.product.brand, b.product.brand],
      price: [Number(a.price), Number(b.price)],
      arrivalDate: [a.arrivalDate, b.arrivalDate],
      outDate: [String(a.outDate), String(b.outDate)],
    };
    const [av, bv] = map[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number')
      return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span className="ml-1 text-indigo-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
      : <span className="ml-1 text-slate-300">⇅</span>;

  const stats = [
    { label: 'En Stock', value: inStock.length, sub: 'disponibles', color: 'bg-emerald-500', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg> },
    { label: 'Retirados', value: retired.length, sub: 'movimientos', color: 'bg-amber-500', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg> },
    { label: 'Val. Stock', value: fmtCurrency(stockVal), sub: 'inventario activo', color: 'bg-blue-500', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Val. Retirado', value: fmtCurrency(retVal), sub: 'total movimientos', color: 'bg-purple-500', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Ventas / Movimientos</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Historial de retiros</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => { setSearchOpen(v => !v); if (panelOpen) setPanelOpen(false); }}
            title="Consultar por código"
            className={`flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:gap-2 text-sm font-semibold rounded-xl transition shadow-sm touch-manipulation ${
              searchOpen
                ? 'bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200'
                : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white'
            }`}
          >
            <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="hidden sm:inline">{searchOpen ? 'Cerrar' : 'Consultar'}</span>
          </button>

          <button
            onClick={() => { setPanelOpen(v => !v); if (searchOpen) setSearchOpen(false); }}
            title="Retiro múltiple"
            className={`flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 sm:gap-2 text-sm font-semibold rounded-xl transition shadow-sm touch-manipulation ${
              panelOpen
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">{panelOpen ? 'Ocultar' : 'Retiro Múltiple'}</span>
          </button>
        </div>
      </div>

      {searchOpen && <div className="mb-5"><BarcodeScanner /></div>}
      {panelOpen && <div className="mb-5"><MultiWithdrawalPanel onClose={() => setPanelOpen(false)} /></div>}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white mb-2`}>
              {icon}
            </div>
            <p className="text-base sm:text-xl font-bold text-slate-800 truncate">{value}</p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5 leading-tight">{label}</p>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* BÚSQUEDA */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar producto, código, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={itemsPerPage}
          onChange={e => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none shrink-0"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      {/* ── MÓVIL: tarjetas ── */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium">No hay retiros registrados</p>
          </div>
        ) : paginated.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-amber-400" />
            <div className="p-4">
              {/* Producto + fecha retiro */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-base leading-tight">{item.product.name}</p>
                  {item.product.brand && (
                    <p className="text-sm text-slate-500 mt-0.5">{item.product.brand}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-100 text-amber-800 whitespace-nowrap shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  </svg>
                  {fmt(item.outDate)}
                </span>
              </div>

              {/* Métricas */}
              <div className="flex gap-4 mt-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Precio</p>
                  <p className="text-base font-bold text-slate-800">{fmtCurrency(item.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Ingreso</p>
                  <p className="text-sm font-medium text-slate-600">{fmt(item.arrivalDate)}</p>
                </div>
              </div>

              {/* Nota + código */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {item.withdrawalNote && (
                  <p className="text-xs text-slate-500 leading-snug">{item.withdrawalNote}</p>
                )}
                <p className="font-mono text-xs text-slate-400">{item.barcode}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: tabla ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              {([
                ['barcode', 'Código'],
                ['product', 'Producto'],
                ['brand', 'Marca'],
                ['price', 'Precio'],
                ['arrivalDate', 'Ingreso'],
                ['outDate', 'Salida'],
              ] as [SortKey, string][]).map(([k, lbl]) => (
                <th
                  key={k}
                  onClick={() => handleSort(k)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:bg-slate-200 select-none"
                >
                  {lbl}<SortIcon k={k} />
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nota de Retiro</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length ? paginated.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.barcode}</td>
                <td className="px-4 py-3 text-slate-800 font-medium">{item.product.name}</td>
                <td className="px-4 py-3 text-slate-600">{item.product.brand}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{fmtCurrency(item.price)}</td>
                <td className="px-4 py-3 text-slate-500">{fmt(item.arrivalDate)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                    {fmt(item.outDate)}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  <div className="truncate max-w-[180px]" title={item.withdrawalNote || ''}>{item.withdrawalNote || '—'}</div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-400 text-sm">No hay retiros registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-between mt-4 gap-2">
        <span className="text-xs text-slate-400">
          {filtered.length} retiro{filtered.length !== 1 ? 's' : ''} · Pág.&nbsp;
          <span className="font-medium text-slate-600">{currentPage}</span> / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 active:bg-slate-100 transition touch-manipulation"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50 active:bg-slate-100 transition touch-manipulation"
          >
            Siguiente
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
