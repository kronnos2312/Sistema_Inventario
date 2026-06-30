'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import InventoryEditor from '../inventory/editor/Inventory';
import Modal from '../base/context/Modal';
import ConfirmDialog from '../base/context/ConfirmDialog';
import QrScanButton from '../base/QrScanButton';
import { InventoryItem } from '@/app/model/InventoryItem';
import { Product } from '@/app/model/Product';

type SortKey = 'id' | 'quantity' | 'price' | 'arrivalDate' | 'outDate' | 'barcode' | 'description' | 'model';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'in-stock' | 'retired';

const emptyProduct: Product = { id: 0, name: '', brand: '', model: '', category: null };
const emptyItem: InventoryItem = {
  id: 0, quantity: 0, price: 0, description: '',
  arrivalDate: '', outDate: '', barcode: '', product: emptyProduct,
};

const fmt = (d: string) => (d ? d.split('T')[0] : '—');
const fmtCurrency = (v: number | '') =>
  v !== '' ? `$${Number(v).toLocaleString('es-CO')}` : '—';

const StatusBadge = ({ inStock }: { inStock: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
    inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {inStock ? 'En Stock' : 'Retirado'}
  </span>
);

export default function InventoryTable() {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem>(emptyItem);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const { inventory, fetchInventory, deleteInventory } = useInventoryStore();

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { setCurrentPage(1); }, [search, itemsPerPage, statusFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const openCreate = () => {
    setSelectedItem({ ...emptyItem, product: { ...emptyProduct } });
    setOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setSelectedItem({
      ...item,
      arrivalDate: fmt(item.arrivalDate) === '—' ? '' : fmt(item.arrivalDate),
      outDate: fmt(item.outDate) === '—' ? '' : fmt(item.outDate),
    });
    setOpen(true);
  };

  const requestDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) await deleteInventory(itemToDelete);
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  const byStatus = inventory.filter(i => {
    if (statusFilter === 'in-stock') return !i.outDate;
    if (statusFilter === 'retired') return !!i.outDate;
    return true;
  });

  const filtered = byStatus.filter(i =>
    `${i.barcode} ${i.price} ${i.product.model} ${i.product.name} ${i.product.brand}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const av: any = sortKey === 'model' ? a.product.model : (a as Record<string, unknown>)[sortKey];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bv: any = sortKey === 'model' ? b.product.model : (b as Record<string, unknown>)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
    return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const inStockCount = inventory.filter(i => !i.outDate).length;
  const retiredCount = inventory.filter(i => !!i.outDate).length;

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span className="ml-1 text-indigo-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
      : <span className="ml-1 text-slate-300">⇅</span>;

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4 gap-2">
      <span className="text-xs text-slate-400">
        {sorted.length} registro{sorted.length !== 1 ? 's' : ''} · Pág.&nbsp;
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
  );

  return (
    <div className="p-3 sm:p-6">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Inventario</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {inStockCount} en stock · {retiredCount} retirados · {inventory.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0 touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline sm:inline">Nuevo</span>
        </button>
      </div>

      {/* CONTROLES */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Búsqueda */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar código, modelo, precio, marca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <QrScanButton onScan={code => setSearch(code)} />
        </div>

        {/* Filtros estado + items por página */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1.5">
            {([
              { key: 'all', label: 'Todos' },
              { key: 'in-stock', label: 'En Stock' },
              { key: 'retired', label: 'Retirados' },
            ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition touch-manipulation ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 active:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none shrink-0"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* ── MÓVIL: tarjetas ── */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No se encontraron registros</p>
          </div>
        ) : paginated.map(item => {
          const inStock = !item.outDate;
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Card top bar */}
              <div className={`h-1 ${inStock ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <div className="p-4">
                {/* Fila 1: estado + acciones */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge inStock={inStock} />
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 text-xs font-semibold rounded-lg transition touch-manipulation"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => requestDelete(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 text-xs font-semibold rounded-lg transition touch-manipulation"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Fila 2: nombre producto */}
                <p className="font-semibold text-slate-800 text-base leading-tight">
                  {item.product.name}
                </p>
                {(item.product.model || item.product.brand) && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[item.product.brand, item.product.model].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Fila 3: métricas clave */}
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Precio</p>
                    <p className="text-base font-bold text-slate-800">{fmtCurrency(item.price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Cantidad</p>
                    <p className="text-base font-bold text-slate-800">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Ingreso</p>
                    <p className="text-sm font-medium text-slate-600">{fmt(item.arrivalDate)}</p>
                  </div>
                </div>

                {/* Fila 4: código de barras */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="font-mono text-xs text-slate-500">{item.barcode}</span>
                  {item.description && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400 truncate">{item.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: tabla ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              {([
                ['id', 'ID'],
                ['quantity', 'Cant.'],
                ['price', 'Precio'],
                ['model', 'Modelo'],
                ['arrivalDate', 'Ingreso'],
                ['outDate', 'Salida'],
                ['barcode', 'Código'],
                ['description', 'Descripción'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:bg-slate-200 select-none"
                >
                  {label}<SortIcon k={key} />
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length ? paginated.map(item => {
              const inStock = !item.outDate;
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{item.id}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{item.quantity}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{fmtCurrency(item.price)}</td>
                  <td className="px-4 py-3 text-slate-700">{item.product.model || item.product.name}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(item.arrivalDate)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmt(item.outDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.barcode}</td>
                  <td className="px-4 py-3 text-slate-400">
                    <div className="truncate max-w-[140px]" title={item.description}>{item.description || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge inStock={inStock} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                      >Editar</button>
                      <button
                        onClick={() => requestDelete(item)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
                      >Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={10} className="py-14 text-center text-slate-400 text-sm">No se encontraron registros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination />

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={selectedItem.id ? 'Editar Registro de Inventario' : 'Nuevo Registro de Inventario'}
      >
        <InventoryEditor initialData={selectedItem} onSave={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        message={`¿Eliminar el registro con código "${itemToDelete?.barcode}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setItemToDelete(null); }}
      />
    </div>
  );
}
