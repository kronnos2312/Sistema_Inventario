'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Centra el modal antes del primer paint (sin flash visible)
  useLayoutEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const el = modalRef.current;
    setPos({
      x: Math.max(16, (window.innerWidth - el.offsetWidth) / 2),
      y: Math.max(16, (window.innerHeight - el.offsetHeight) / 2),
    });
  }, [isOpen]);

  // Escape + bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  // Pointer events — cubren mouse, touch y stylus con un solo handler
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId); // captura el puntero aunque salga del header
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragging) return;
    const el = modalRef.current;
    setPos({
      x: clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - (el?.offsetWidth ?? 0)),
      y: clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - (el?.offsetHeight ?? 0)),
    });
  };

  const onPointerUp = () => setDragging(false);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`modal-panel-enter fixed w-[calc(100vw-2rem)] max-w-[600px] max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/80 overflow-hidden ${
          dragging ? 'select-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35)]' : ''
        }`}
        style={{ left: pos.x, top: pos.y }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de acento */}
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 flex-shrink-0" />

        {/* Header — zona de arrastre */}
        <header
          className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0 touch-none ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex items-center gap-2.5">
            {/* Icono de agarre */}
            <div className="grid grid-cols-2 gap-[3px] opacity-30 flex-shrink-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-slate-500" />
              ))}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">
              {title}
            </h3>
          </div>

          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Cuerpo */}
        <section className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </section>
      </div>
    </div>
  );
}
