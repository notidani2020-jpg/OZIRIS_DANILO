import { useState, useEffect } from 'react';
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  deleteTrackApi,
} from '@/services/adminService';
import { fetchTracks } from '@/services/trackService';
import { AdminStats, User, Track } from '@/types';

export function useAdminDashboard(token: string | null) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content'>('dashboard');

  // Stats State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Tracks State
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  // Modals & Notifications
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadStats = async () => {
    if (!token) return;
    try {
      setIsLoadingStats(true);
      const data = await fetchAdminStats(token);
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    if (!token) return;
    try {
      setIsLoadingUsers(true);
      const data = await fetchAdminUsers(token, userSearch);
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      showNotification('error', err.message || 'Error al obtener lista de usuarios.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTracksData = async () => {
    try {
      setIsLoadingTracks(true);
      const data = await fetchTracks();
      setTracks(data);
    } catch (err: any) {
      console.error('Error fetching tracks:', err);
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const refreshAll = () => {
    loadStats();
    loadUsers();
    loadTracksData();
    showNotification('success', 'Datos del sistema actualizados.');
  };

  useEffect(() => {
    loadStats();
    loadUsers();
    loadTracksData();
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        loadUsers();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleToggleUserStatus = async (userToToggle: User) => {
    if (!token) return;
    try {
      const nextStatus = !userToToggle.isActive;
      await updateAdminUser(token, userToToggle.id, { isActive: nextStatus });
      showNotification('success', `Usuario ${userToToggle.name} ${nextStatus ? 'activado' : 'desactivado'}.`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cambiar estado.');
    }
  };

  const handleChangeUserRole = async (userToChange: User, nextRole: string) => {
    if (!token || nextRole === userToChange.role) return;
    try {
      await updateAdminUser(token, userToChange.id, { role: nextRole });
      showNotification('success', `Rol de ${userToChange.name} cambiado a ${nextRole}.`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cambiar rol.');
    }
  };

  const handleToggleVerified = async (artistUser: User) => {
    if (!token) return;
    try {
      const next = !artistUser.artist?.verified;
      await updateAdminUser(token, artistUser.id, { verified: next });
      showNotification('success', `${artistUser.artistName || artistUser.name} ${next ? 'verificado' : 'sin verificar'}.`);
      loadUsers();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al cambiar verificación.');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete || !token) return;
    try {
      await deleteAdminUser(token, userToDelete.id);
      showNotification('success', `Usuario ${userToDelete.name} eliminado correctamente.`);
      setUserToDelete(null);
      loadUsers();
      loadStats();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al eliminar usuario.');
    }
  };

  const confirmDeleteTrack = async () => {
    if (!trackToDelete || !token) return;
    try {
      await deleteTrackApi(token, trackToDelete.id);
      showNotification('success', `Beat "${trackToDelete.title}" eliminado correctamente.`);
      setTrackToDelete(null);
      loadTracksData();
      loadStats();
    } catch (err: any) {
      showNotification('error', err.message || 'Error al eliminar Beat.');
    }
  };

  return {
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
  };
}
