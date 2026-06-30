'use client';

import { useEffect, useState } from 'react';
import ProductTable from './ProductTable';
import GroupsPanel from './GroupsPanel';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { Category } from '@/app/model/Category';
import ConfirmDialog from '../base/context/ConfirmDialog';

type Tab = 'products' | 'groups' | 'categories';

// ── Panel de gestión de categorías ───────────────────────────────────────────
function CategoriesPanel() {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createCategory(newName.trim());
    setCreating(false);
    setNewName('');
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const cancelEdit = () => { setEditingId(null); setEditName(''); };

  const handleUpdate = async () => {
    if (!editName.trim() || editingId === null) return;
    setSaving(true);
    await updateCategory({ id: editingId, name: editName.trim() });
    setSaving(false);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    await deleteCategory(confirmDel.id);
    setConfirmDel(null);
  };

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">Categorías de productos</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Clasifica tus productos. Una categoría se asigna por producto desde su formulario de edición.
        </p>
      </div>

      {/* Formulario nueva categoría */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nueva categoría</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Ej: Laptops, Monitores, Periféricos..."
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition"
          >
            {creating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay categorías. Crea una para empezar.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map(c => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === c.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') cancelEdit(); }}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdate}
                      disabled={!editName.trim() || saving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition"
                    >
                      {saving ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{c.name}</p>
                      <p className="text-xs text-slate-400">ID: {c.id}</p>
                    </div>
                    <button
                      onClick={() => startEdit(c)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmDel(c)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDel}
        message={`¿Eliminar la categoría "${confirmDel?.name}"? Los productos que la tenían quedarán sin categoría.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>('products');

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'products',
      label: 'Productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
    },
    {
      id: 'categories',
      label: 'Categorías',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: 'groups',
      label: 'Grupos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <main className="bg-slate-50 min-h-screen">
      {/* Barra de tabs */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit shadow-sm">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {tab === 'products' && <ProductTable />}
      {tab === 'categories' && (
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <CategoriesPanel />
        </div>
      )}
      {tab === 'groups' && (
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <GroupsPanel />
        </div>
      )}
    </main>
  );
}
