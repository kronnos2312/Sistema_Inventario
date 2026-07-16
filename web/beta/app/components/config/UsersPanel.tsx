'use client';

import { useEffect, useState } from 'react';
import Modal from '../base/context/Modal';
import ConfirmDialog from '../base/context/ConfirmDialog';
import { useUserStore } from '@/app/store/useUserStore';
import { Role, User } from '@/app/model/User';

const emptyForm = { username: '', password: '', fullName: '', role: 'VENDEDOR' as Role };

function formatLastLogin(value: number | null): string {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function UsersPanel() {
  const { users, fetchUsers, createUser, updateUserRole, setUserActive, resetPassword } = useUserStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [blockTarget, setBlockTarget] = useState<User | null>(null);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const handleCreate = async () => {
    if (!form.username.trim() || !form.password.trim() || !form.fullName.trim()) return;
    setSaving(true);
    const ok = await createUser(form);
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  const requestBlock = (user: User) => setBlockTarget(user);
  const confirmBlock = async () => {
    if (blockTarget) await setUserActive(blockTarget.id, false);
    setBlockTarget(null);
  };

  const openResetPassword = (user: User) => { setResetTarget(user); setNewPassword(''); };
  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) return;
    setResetting(true);
    const ok = await resetPassword(resetTarget.id, newPassword);
    setResetting(false);
    if (ok) setResetTarget(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="font-medium text-slate-700 flex-1">Usuarios de la app Android</h3>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Administra quién puede iniciar sesión en la app Android: crea cuentas, asigna su rol y bloquea el acceso cuando sea necesario.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Última conexión</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? users.map(user => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-800">{user.username}</td>
                <td className="px-4 py-2.5 text-slate-600">{user.fullName}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={user.role}
                    onChange={e => updateUserRole(user.id, e.target.value as Role)}
                    className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="VENDEDOR">Vendedor</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  {user.active ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Activo</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">Bloqueado</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{formatLastLogin(user.lastLoginAt)}</td>
                <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => openResetPassword(user)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition"
                  >Restablecer contraseña</button>
                  {user.active ? (
                    <button
                      onClick={() => requestBlock(user)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition"
                    >Bloquear</button>
                  ) : (
                    <button
                      onClick={() => setUserActive(user.id, true)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                    >Desbloquear</button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo usuario">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600">Usuario</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Nombre completo</label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="ADMIN">Admin</option>
              <option value="VENDEDOR">Vendedor</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >Cancelar</button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition"
            >{saving ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={resetTarget !== null} onClose={() => setResetTarget(null)} title="Restablecer contraseña">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Nueva contraseña para <span className="font-medium text-slate-700">{resetTarget?.username}</span>.
          </p>
          <div>
            <label className="text-xs font-medium text-slate-600">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setResetTarget(null)}
              className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >Cancelar</button>
            <button
              onClick={handleResetPassword}
              disabled={resetting || !newPassword.trim()}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition"
            >{resetting ? 'Guardando...' : 'Restablecer'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={blockTarget !== null}
        title="Bloquear usuario"
        message={`¿Bloquear a "${blockTarget?.username}"? No podrá iniciar sesión en la app Android hasta que lo desbloquees.`}
        confirmLabel="Bloquear"
        onConfirm={confirmBlock}
        onCancel={() => setBlockTarget(null)}
      />
    </div>
  );
}
