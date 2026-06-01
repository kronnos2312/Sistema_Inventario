'use client';

import React, { ReactNode, useState } from 'react';
import Modal from '../base/context/Modal';
import InventoryEditor from '../inventory/editor/Inventory';
import ProductEditor from '../product/editor/Product';
import ManualInventory from '../sales/ManualInventory';
import { Product } from '@/app/model/Product';
import { InventoryItem } from '@/app/model/InventoryItem';
import { WInventory } from '@/app/model/WithdrawInventory';

type Tab = 'bienvenida' | 'productos' | 'inventarios' | 'ventas';
type EditorType = 'product' | 'inventory' | 'withdrawal' | null;

type Props = {
  onNavigate?: (tab: Tab) => void;
};

const emptyProduct: Product = { id: 0, name: '', brand: '', model: '' };
const emptyInventory: InventoryItem = {
  id: 0, quantity: 0, price: 0, description: '',
  arrivalDate: '', outDate: '', barcode: '', product: emptyProduct,
};
const emptyW: WInventory = { barCode: '', dateOut: '' };

const appClient = process.env.NEXT_PUBLIC_SITE_CLIENT || 'Tu Empresa';
const appTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'Sistema de Inventario';

type QuickAction = {
  label: string;
  description: string;
  icon: ReactNode;
  action: () => void;
  colorIcon: string;
  colorBorder: string;
};

export default function Welcome({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [editor, setEditor] = useState<EditorType>(null);

  const closeModal = () => { setOpen(false); setEditor(null); };

  const openEditor = (type: EditorType) => {
    setEditor(type);
    setOpen(true);
  };

  const actions: QuickAction[] = [
    {
      label: 'Registrar Producto',
      description: 'Agrega un nuevo producto al catálogo',
      colorIcon: 'bg-indigo-100 text-indigo-600',
      colorBorder: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
      action: () => openEditor('product'),
    },
    {
      label: 'Registrar Entrada',
      description: 'Ingresa artículos al inventario',
      colorIcon: 'bg-emerald-100 text-emerald-600',
      colorBorder: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      action: () => openEditor('inventory'),
    },
    {
      label: 'Registrar Retiro',
      description: 'Registra la salida de un artículo',
      colorIcon: 'bg-amber-100 text-amber-600',
      colorBorder: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      action: () => openEditor('withdrawal'),
    },
    {
      label: 'Ver Ventas',
      description: 'Consulta el historial de movimientos',
      colorIcon: 'bg-purple-100 text-purple-600',
      colorBorder: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      action: () => onNavigate?.('ventas'),
    },
  ];

  const navLinks: { label: string; tab: Tab; icon: ReactNode }[] = [
    {
      label: 'Productos',
      tab: 'productos',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      ),
    },
    {
      label: 'Inventario',
      tab: 'inventarios',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Ventas',
      tab: 'ventas',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center bg-white">
      {/* HERO */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-1">
          {appTitle}
        </h1>
        <p className="text-indigo-600 font-semibold text-base">{appClient}</p>
        <p className="text-slate-400 text-sm mt-1">Gestiona tu inventario de forma eficiente</p>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="w-full max-w-md mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Acciones Rápidas</p>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(({ label, description, icon, action, colorIcon, colorBorder }) => (
            <button
              key={label}
              onClick={action}
              className={`bg-white border ${colorBorder} rounded-xl p-4 flex flex-col items-start gap-2 transition shadow-sm text-left`}
            >
              <span className={`${colorIcon} rounded-lg p-1.5`}>{icon}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <div className="flex gap-3 flex-wrap justify-center">
        {navLinks.map(({ label, tab, icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate?.(tab)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition border border-slate-200"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={open}
        onClose={closeModal}
        title={
          editor === 'product' ? 'Registrar Producto'
          : editor === 'inventory' ? 'Registrar Entrada de Inventario'
          : editor === 'withdrawal' ? 'Registrar Retiro / Salida'
          : ''
        }
      >
        {editor === 'product' && (
          <ProductEditor initialData={emptyProduct} onSave={closeModal} onCancel={closeModal} />
        )}
        {editor === 'inventory' && (
          <InventoryEditor initialData={emptyInventory} onSave={closeModal} onCancel={closeModal} />
        )}
        {editor === 'withdrawal' && (
          <ManualInventory initialData={emptyW} onSend={closeModal} onCancel={closeModal} />
        )}
      </Modal>
    </div>
  );
}
