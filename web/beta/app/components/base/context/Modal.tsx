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
  const [isMobile, setIsMobile] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Centra el modal antes del primer paint (desktop only)
  useLayoutEffect(() => {
    if (!isOpen || !modalRef.current || isMobile) return;
    const el = modalRef.current;
    setPos({
      x: Math.max(16, (window.innerWidth - el.offsetWidth) / 2),
      y: Math.max(16, (window.innerHeight - el.offsetHeight) / 2),
    });
  }, [isOpen, isMobile]);

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

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobile) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragging || isMobile) return;
    const el = modalRef.current;
    setPos({
      x: clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - (el?.offsetWidth ?? 0)),
      y: clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - (el?.offsetHeight ?? 0)),
    });
  };

  const onPointerUp = () => setDragging(false);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-[2px] flex items-end"
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className="modal-panel-enter w-full max-h-[95dvh] flex flex-col bg-white rounded-t-2xl shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Barra de acento */}
          <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 flex-shrink-0 rounded-t-2xl" />

          {/* Handle drag visual (solo decorativo en mobile) */}
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>

          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Cuerpo — scroll independiente sin encadenarse con la página */}
          <section className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </section>
        </div>
      </div>
    );
  }

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
            <div className="grid grid-cols-2 gap-[3px] opacity-30 flex-shrink-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-slate-500" />
              ))}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">{title}</h3>
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
        <section className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 scrollbar-thin">
          {children}
        </section>
      </div>
    </div>
  );
}
