'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect();
      setPosition({
        x: Math.max(16, window.innerWidth / 2 - rect.width / 2),
        y: Math.max(16, window.innerHeight / 2 - rect.height / 2),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onEsc);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    offset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  }, []);

  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-[1000] bg-slate-900/50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`modal-panel-enter fixed w-[calc(100vw-2rem)] max-w-[600px] max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200/80 overflow-hidden ${dragging ? 'cursor-grabbing select-none opacity-[0.97]' : ''}`}
        style={{ left: position.x, top: position.y }}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar top */}
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400 flex-shrink-0" />

        {/* Header */}
        <header
          className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2.5">
            {/* Grip dots */}
            <div className="grid grid-cols-2 gap-[3px] opacity-25 flex-shrink-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-slate-500" />
              ))}
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">
              {title}
            </h3>
          </div>

          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <section className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {children}
        </section>
      </div>
    </div>
  );
}
