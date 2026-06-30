'use client';

import { useEffect, useState } from 'react';
import { userProductStore } from '@/app/store/userProductStore';
import Modal from '../base/context/Modal';
import ConfirmDialog from '../base/context/ConfirmDialog';
import ProductEditor from './editor/Product';
import { Product } from '@/app/model/Product';

const emptyProduct: Product = { id: 0, name: '', model: '', brand: '', category: null };

export default function ProductTable() {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product>(emptyProduct);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const { product, fetchProduct, deleteProduct } = userProductStore();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({ name: '', model: '', brand: '', category: '' });

  useEffect(() => { fetchProduct(); }, [fetchProduct]);
  useEffect(() => { setCurrentPage(1); }, [search, filters, itemsPerPage]);

  const openCreate = () => { setSelectedItem({ ...emptyProduct }); setOpen(true); };
  const openEdit = (item: Product) => { setSelectedItem({ ...item }); setOpen(true); };
  const requestDelete = (item: Product) => { setItemToDelete(item); setConfirmOpen(true); };

  const confirmDelete = async () => {
    if (itemToDelete) await deleteProduct(itemToDelete);
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) =>
    setFilters(prev => ({ ...prev, [field]: value }));

  const filtered = product.filter(item => {
    const catName = item.category?.name ?? '';
    const global = `${item.name} ${item.model} ${item.brand} ${catName}`.toLowerCase().includes(search.toLowerCase());
    const col =
      item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      item.model.toLowerCase().includes(filters.model.toLowerCase()) &&
      item.brand.toLowerCase().includes(filters.brand.toLowerCase()) &&
      catName.toLowerCase().includes(filters.category.toLowerCase());
    return global && col;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const Pagination = () => (
    <div className="flex items-center justify-between mt-4 gap-2">
      <span className="text-xs text-slate-400">
        {filtered.length} producto{filtered.length !== 1 ? 's' : ''} · Pág.&nbsp;
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
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">Productos</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {product.length} producto{product.length !== 1 ? 's' : ''} registrado{product.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0 touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* CONTROLES */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar nombre, modelo o marca..."
            className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="text-sm font-medium">No se encontraron productos</p>
          </div>
        ) : paginated.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1 bg-indigo-400" />
            <div className="p-4">
              {/* Nombre + acciones */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-base leading-tight">{item.name}</p>
                  {item.brand && (
                    <p className="text-sm text-slate-500 mt-0.5">{item.brand}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 text-xs font-semibold rounded-lg transition touch-manipulation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => requestDelete(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 text-xs font-semibold rounded-lg transition touch-manipulation"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
              {/* Modelo + Categoría */}
              {(item.model || item.category) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 flex-wrap">
                  {item.model && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Modelo</span>
                      <span className="text-xs text-slate-600">{item.model}</span>
                    </div>
                  )}
                  {item.category && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                      {item.category.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: tabla ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Marca</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
            </tr>
            <tr className="bg-slate-50 border-t border-slate-200">
              <th />
              {(['name', 'model', 'brand', 'category'] as const).map(f => (
                <th key={f} className="px-4 py-2">
                  <input
                    placeholder={`Filtrar ${f === 'name' ? 'nombre' : f === 'model' ? 'modelo' : f === 'brand' ? 'marca' : 'categoría'}...`}
                    value={filters[f]}
                    onChange={e => handleFilterChange(f, e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {paginated.length ? paginated.map(item => (
              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{item.id}</td>
                <td className="px-4 py-3 text-slate-800 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{item.model}</td>
                <td className="px-4 py-3 text-slate-600">{item.brand}</td>
                <td className="px-4 py-3">
                  {item.category ? (
                    <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                      {item.category.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
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
            )) : (
              <tr>
                <td colSpan={6} className="py-14 text-center text-slate-400 text-sm">No se encontraron productos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination />

      <Modal isOpen={open} onClose={() => setOpen(false)} title={selectedItem.id ? 'Editar Producto' : 'Nuevo Producto'}>
        <ProductEditor initialData={selectedItem} onSave={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        message={`¿Eliminar el producto "${itemToDelete?.name}"? Esta acción eliminará el producto del sistema.`}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setItemToDelete(null); }}
      />
    </div>
  );
}
