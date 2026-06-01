'use client';

import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import InventoryEditor from '../inventory/editor/Inventory';
import Modal from '../base/context/Modal';
import ConfirmDialog from '../base/context/ConfirmDialog';
import { InventoryItem } from '@/app/model/InventoryItem';
import { Product } from '@/app/model/Product';

type SortKey = 'id' | 'quantity' | 'price' | 'arrivalDate' | 'outDate' | 'barcode' | 'description' | 'model';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'in-stock' | 'retired';

const emptyProduct: Product = { id: 0, name: '', brand: '', model: '' };
const emptyItem: InventoryItem = {
  id: 0, quantity: 0, price: 0, description: '',
  arrivalDate: '', outDate: '', barcode: '', product: emptyProduct,
};

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

  const fmt = (d: string) => (d ? d.split('T')[0] : '—');
  const fmtCurrency = (v: number | '') =>
    v !== '' ? `$${Number(v).toLocaleString('es-CO')}` : '—';

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

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span className="ml-1 text-indigo-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
      : <span className="ml-1 text-slate-300">⇅</span>;

  const inStockCount = inventory.filter(i => !i.outDate).length;
  const retiredCount = inventory.filter(i => !!i.outDate).length;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inStockCount} en stock · {retiredCount} retirados · {inventory.length} total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Registro
        </button>
      </div>

      {/* CONTROLES */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código, precio, modelo, marca..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'in-stock', 'retired'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'in-stock' ? '✓ En Stock' : '↩ Retirados'}
            </button>
          ))}
          <select
            value={itemsPerPage}
            onChange={e => setItemsPerPage(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {inStock ? 'En Stock' : 'Retirado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(item)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => requestDelete(item)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={10} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No se encontraron registros</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-slate-400">
          {sorted.length} registro{sorted.length !== 1 ? 's' : ''} · Página {currentPage} de {totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium bg-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-300"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-xs font-medium bg-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-300"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL EDITOR */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={selectedItem.id ? 'Editar Registro de Inventario' : 'Nuevo Registro de Inventario'}
      >
        <InventoryEditor initialData={selectedItem} onSave={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>

      {/* CONFIRMACIÓN ELIMINAR */}
      <ConfirmDialog
        isOpen={confirmOpen}
        message={`¿Eliminar el registro con código "${itemToDelete?.barcode}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setItemToDelete(null); }}
      />
    </div>
  );
}
