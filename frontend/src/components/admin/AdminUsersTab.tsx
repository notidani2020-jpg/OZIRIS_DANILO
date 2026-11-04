import React from 'react';
import { Search, Shield, CheckCircle, XCircle, Trash2, BadgeCheck } from 'lucide-react';
import { User } from '@/types';

interface AdminUsersTabProps {
  users: User[];
  userSearch: string;
  setUserSearch: (val: string) => void;
  isLoadingUsers: boolean;
  onToggleStatus: (user: User) => void;
  onChangeRole: (user: User, role: string) => void;
  onToggleVerified: (user: User) => void;
  currentUserId?: string;
  onSelectUserToDelete: (user: User) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  userSearch,
  setUserSearch,
  isLoadingUsers,
  onToggleStatus,
  onChangeRole,
  onToggleVerified,
  currentUserId,
  onSelectUserToDelete,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full bg-[#0f151c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50"
          />
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Mostrando {users.length} usuarios
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f151c] border border-emerald-500/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-400 text-xs uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Usuario</th>
                <th className="py-3.5 px-4 font-semibold">Correo</th>
                <th className="py-3.5 px-4 font-semibold">Rol</th>
                <th className="py-3.5 px-4 font-semibold">Estado</th>
                <th className="py-3.5 px-4 font-semibold">Fecha Registro</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-200">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Cargando lista de usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-300">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          {u.bio && <p className="text-[11px] text-zinc-500 truncate max-w-[150px]">{u.bio}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-zinc-500" />
                        <select
                          value={u.role === 'BUYER' ? 'USER' : u.role}
                          disabled={u.id === currentUserId}
                          onChange={(e) => onChangeRole(u, e.target.value)}
                          title={u.id === currentUserId ? 'No puedes cambiar tu propio rol' : 'Cambiar rol'}
                          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                        >
                          <option value="USER">USER</option>
                          <option value="PRODUCER">PRODUCER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        disabled={u.id === currentUserId}
                        onClick={() => onToggleStatus(u)}
                        title="Hacer clic para cambiar estado"
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold transition inline-flex items-center gap-1 disabled:opacity-50 disabled:pointer-events-none ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                        }`}
                      >
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.isActive ? 'Activo' : 'Inactivo'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 text-xs">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === 'PRODUCER' && (
                          <button
                            onClick={() => onToggleVerified(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.artist?.verified
                                ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                            title={u.artist?.verified ? 'Quitar verificación' : 'Verificar artista'}
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          disabled={u.id === currentUserId}
                          onClick={() => onToggleStatus(u)}
                          className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
                          title={u.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          disabled={u.id === currentUserId}
                          onClick={() => onSelectUserToDelete(u)}
                          className="p-1.5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
