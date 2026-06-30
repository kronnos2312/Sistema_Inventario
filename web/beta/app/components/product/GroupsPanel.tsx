'use client';

import { useEffect, useState } from 'react';
import { useProductGroupStore } from '@/app/store/useProductGroupStore';
import { useCategoryStore } from '@/app/store/useCategoryStore';
import { ProductGroup } from '@/app/model/ProductGroup';
import ConfirmDialog from '../base/context/ConfirmDialog';

export default function GroupsPanel() {
  const { groups, fetchGroups, createGroup, updateGroup, deleteGroup, setGroupCategories } = useProductGroupStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [mode, setMode] = useState<'view' | 'new' | 'edit'>('view');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [categoriesDirty, setCategoriesDirty] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductGroup | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchCategories();
  }, [fetchGroups, fetchCategories]);

  const selectGroup = (g: ProductGroup) => {
    setSelectedGroup(g);
    setMode('view');
    setPendingIds(new Set(g.categories.map(c => Number(c.id))));
    setCategoriesDirty(false);
  };

  const openNew = () => {
    setSelectedGroup(null);
    setFormName('');
    setFormDesc('');
    setMode('new');
  };

  const openEdit = (g: ProductGroup) => {
    setSelectedGroup(g);
    setFormName(g.name);
    setFormDesc(g.description);
    setMode('edit');
  };

  const cancelForm = () => {
    setMode('view');
  };

  const submitForm = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    if (mode === 'new') {
      const created = await createGroup(formName.trim(), formDesc.trim());
      if (created) {
        setMode('view');
        setSelectedGroup(created);
        setPendingIds(new Set());
        setCategoriesDirty(false);
      }
    } else if (mode === 'edit' && selectedGroup) {
      const ok = await updateGroup({ ...selectedGroup, name: formName.trim(), description: formDesc.trim() });
      if (ok) setMode('view');
    }
    setSaving(false);
  };

  const toggleCategory = (categoryId: number) => {
    setPendingIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
    setCategoriesDirty(true);
  };

  const saveCategories = async () => {
    if (!selectedGroup?.id) return;
    setSavingCategories(true);
    await setGroupCategories(Number(selectedGroup.id), Array.from(pendingIds));
    setSavingCategories(false);
    setCategoriesDirty(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete?.id) return;
    await deleteGroup(Number(confirmDelete.id));
    if (selectedGroup?.id === confirmDelete.id) {
      setSelectedGroup(null);
      setMode('view');
    }
    setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">

      {/* Panel izquierdo: lista de grupos */}
      <div className="w-full md:w-64 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Grupos ({groups.length})
          </span>
          <button
            onClick={openNew}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {groups.length === 0 && (
            <li className="py-10 text-center text-xs text-slate-400">
              No hay grupos.<br />Crea uno para empezar.
            </li>
          )}
          {groups.map(g => (
            <li key={g.id}>
              <button
                onClick={() => selectGroup(g)}
                className={`w-full text-left px-4 py-3 transition flex items-center justify-between gap-2 ${
                  selectedGroup?.id === g.id
                    ? 'bg-indigo-50 border-l-2 border-indigo-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${selectedGroup?.id === g.id ? 'text-indigo-800' : 'text-slate-700'}`}>
                    {g.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {g.categories.length} categoría{g.categories.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(g); }}
                  className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition rounded"
                  title="Eliminar grupo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Panel derecho: detalle */}
      <div className="flex-1 min-w-0">

        {/* Formulario nuevo/editar */}
        {(mode === 'new' || mode === 'edit') && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="font-medium text-slate-700">
                {mode === 'new' ? 'Nuevo grupo' : 'Editar grupo'}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Periféricos, Laptops, Monitores..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Descripción</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Descripción opcional del grupo..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={submitForm}
                disabled={!formName.trim() || saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition"
              >
                {saving ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {mode === 'new' ? 'Crear grupo' : 'Guardar cambios'}
              </button>
              <button
                onClick={cancelForm}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Vista del grupo seleccionado */}
        {mode === 'view' && selectedGroup && (
          <div className="space-y-4">
            {/* Header del grupo */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">{selectedGroup.name}</h3>
                  {selectedGroup.description && (
                    <p className="text-sm text-slate-500 mt-1">{selectedGroup.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    ID del grupo: <span className="font-mono text-indigo-600">{selectedGroup.id}</span>
                    {' '}·{' '}
                    <span>{selectedGroup.categories.length} categoría{selectedGroup.categories.length !== 1 ? 's' : ''} asignada{selectedGroup.categories.length !== 1 ? 's' : ''}</span>
                  </p>
                </div>
                <button
                  onClick={() => openEdit(selectedGroup)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar
                </button>
              </div>
            </div>

            {/* Asignación de categorías */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-slate-700">Categorías del grupo</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {pendingIds.size} seleccionada{pendingIds.size !== 1 ? 's' : ''}
                  </span>
                  {categoriesDirty && (
                    <button
                      onClick={saveCategories}
                      disabled={savingCategories}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold rounded-lg transition"
                    >
                      {savingCategories ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Guardar
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-400">
                El webhook de este grupo devolverá los productos en stock que pertenezcan a alguna de estas categorías.
              </p>

              {categories.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                  No hay categorías registradas. Créalas desde la pestaña <strong>Categorías</strong>.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto rounded-lg border border-slate-100">
                  {categories.map(c => {
                    const cid = Number(c.id);
                    const checked = pendingIds.has(cid);
                    return (
                      <label key={c.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${checked ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(cid)}
                          className="w-4 h-4 rounded accent-indigo-600 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{c.name}</p>
                        </div>
                        {checked && (
                          <span className="shrink-0 text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded">
                            En grupo
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {mode === 'view' && !selectedGroup && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 flex flex-col items-center gap-3 text-slate-400">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium">Selecciona un grupo o crea uno nuevo</p>
            <p className="text-xs text-center max-w-xs">
              Los grupos agrupan categorías y generan webhooks de stock segmentados para sistemas externos.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        message={`¿Eliminar el grupo "${confirmDelete?.name}"? Las categorías no serán eliminadas, solo se desvinculan del grupo.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
