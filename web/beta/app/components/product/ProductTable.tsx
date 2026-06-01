'use client';

import { useEffect, useState } from 'react';
import { userProductStore } from '@/app/store/userProductStore';
import Modal from '../base/context/Modal';
import ConfirmDialog from '../base/context/ConfirmDialog';
import ProductEditor from './editor/Product';
import { Product } from '@/app/model/Product';

const emptyProduct: Product = { id: 0, name: '', model: '', brand: '' };

export default function ProductTable() {
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product>(emptyProduct);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Product | null>(null);

  const { product, fetchProduct, deleteProduct } = userProductStore();

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({ name: '', model: '', brand: '' });

  useEffect(() => { fetchProduct(); }, [fetchProduct]);
  useEffect(() => { setCurrentPage(1); }, [search, filters, itemsPerPage]);

  const openCreate = () => {
    setSelectedItem({ ...emptyProduct });
    setOpen(true);
  };

  const openEdit = (item: Product) => {
    setSelectedItem({ ...item });
    setOpen(true);
  };

  const requestDelete = (item: Product) => {
    setItemToDelete(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) await deleteProduct(itemToDelete);
    setConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filtered = product.filter(item => {
    const global = `${item.name} ${item.model} ${item.brand}`.toLowerCase().includes(search.toLowerCase());
    const col =
      item.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      item.model.toLowerCase().includes(filters.model.toLowerCase()) &&
      item.brand.toLowerCase().includes(filters.brand.toLowerCase());
    return global && col;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Productos</h1>
          <p className="text-sm text-slate-500 mt-1">{product.length} producto{product.length !== 1 ? 's' : ''} registrado{product.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
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
            placeholder="Búsqueda global por nombre, modelo o marca..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
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

      {/* TABLA */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Marca</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
            </tr>
            <tr className="bg-slate-50 border-t border-slate-200">
              <th />
              {(['name', 'model', 'brand'] as const).map(f => (
                <th key={f} className="px-3 py-2">
                  <input
                    placeholder={`Filtrar ${f === 'name' ? 'nombre' : f === 'model' ? 'modelo' : 'marca'}...`}
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
            )) : (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                    </svg>
                    <p className="text-sm">No se encontraron productos</p>
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
          {filtered.length} producto{filtered.length !== 1 ? 's' : ''} · Página {currentPage} de {totalPages || 1}
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
            disabled={currentPage >= totalPages || totalPages === 0}
            className="px-3 py-1.5 text-xs font-medium bg-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-300"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL EDITOR */}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={selectedItem.id ? 'Editar Producto' : 'Nuevo Producto'}>
        <ProductEditor initialData={selectedItem} onSave={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>

      {/* CONFIRMACIÓN ELIMINAR */}
      <ConfirmDialog
        isOpen={confirmOpen}
        message={`¿Eliminar el producto "${itemToDelete?.name}"? Esta acción eliminará el producto del sistema.`}
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmOpen(false); setItemToDelete(null); }}
      />
    </div>
  );
}
