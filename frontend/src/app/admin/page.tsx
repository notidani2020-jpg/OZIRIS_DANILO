"use client";

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
  useAdminDashboard,
  ToastNotification,
  AdminHeader,
  AdminStatsTab,
  AdminUsersTab,
  AdminTracksTab,
  DeleteConfirmModal,
} from '@/components/admin';
import { Shield, Users, Music } from 'lucide-react';

export default function AdminPage() {
  return (
    <ProtectedRoute adminOnly={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user: currentUser, token, logout } = useAuth();
  const {
    activeTab,
    setActiveTab,
    stats,
    isLoadingStats,
    users,
    userSearch,
    setUserSearch,
    isLoadingUsers,
    tracks,
    isLoadingTracks,
    userToDelete,
    setUserToDelete,
    trackToDelete,
    setTrackToDelete,
    notification,
    handleToggleUserStatus,
    handleChangeUserRole,
    handleToggleVerified,
    confirmDeleteUser,
    confirmDeleteTrack,
    refreshAll,
  } = useAdminDashboard(token);

  return (
    <div className="min-h-screen bg-[#090d10] text-white flex flex-col font-sans">
      <ToastNotification notification={notification} />

      <AdminHeader currentUser={currentUser} onLogout={logout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-8">
        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-3 border-b border-emerald-500/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#0f151c] text-zinc-400 hover:text-white hover:bg-emerald-500/10 border border-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#0f151c] text-zinc-400 hover:text-white hover:bg-emerald-500/10 border border-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestión de Usuarios</span>
            <span className={`ml-1 text-[11px] px-2 py-0.5 rounded-full ${
              activeTab === 'users' ? 'bg-slate-950/25 text-slate-950 font-bold' : 'bg-emerald-500/15 text-emerald-300'
            }`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              activeTab === 'content'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                : 'bg-[#0f151c] text-zinc-400 hover:text-white hover:bg-emerald-500/10 border border-white/5'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Gestión de Beats ({tracks.length})</span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        {activeTab === 'dashboard' && (
          <AdminStatsTab
            stats={stats}
            isLoadingStats={isLoadingStats}
            tracks={tracks}
            onNavigateTab={setActiveTab}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'users' && (
          <AdminUsersTab
            users={users}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            isLoadingUsers={isLoadingUsers}
            onToggleStatus={handleToggleUserStatus}
            onChangeRole={handleChangeUserRole}
            onToggleVerified={handleToggleVerified}
            currentUserId={currentUser?.id}
            onSelectUserToDelete={setUserToDelete}
          />
        )}

        {activeTab === 'content' && (
          <AdminTracksTab
            tracks={tracks}
            isLoadingTracks={isLoadingTracks}
            onSelectTrackToDelete={setTrackToDelete}
          />
        )}
      </main>

      {/* CONFIRMATION MODALS */}
      <DeleteConfirmModal
        isOpen={!!userToDelete}
        title="Confirmar Eliminación"
        description={
          userToDelete ? (
            <>
              ¿Estás seguro de que deseas eliminar permanentemente al usuario{' '}
              <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email})? Esta acción no se puede deshacer.
            </>
          ) : null
        }
        confirmButtonText="Sí, Eliminar Usuario"
        onConfirm={confirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      <DeleteConfirmModal
        isOpen={!!trackToDelete}
        title="Eliminar Beat del Catálogo"
        description={
          trackToDelete ? (
            <>
              ¿Estás seguro de que deseas eliminar el Beat <strong className="text-white">"{trackToDelete.title}"</strong> del catálogo de OZIRIS?
            </>
          ) : null
        }
        confirmButtonText="Sí, Eliminar Beat"
        onConfirm={confirmDeleteTrack}
        onCancel={() => setTrackToDelete(null)}
      />
    </div>
  );
}
