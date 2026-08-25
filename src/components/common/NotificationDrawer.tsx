import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { Bell, CheckCheck, X, Activity, ShieldAlert, Sparkles, Server } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useSocket();
  const { role, activeDoctorId, activePatientId } = useAuth();

  if (!isOpen) return null;

  // Filter notifications relevant to current role
  const relevantNotifications = notifications.filter((n) => {
    if (role === 'ADMIN') return true;
    if (role === 'DOCTOR') return n.recipientRole === 'DOCTOR' || !n.recipientId || n.recipientId === activeDoctorId;
    if (role === 'PATIENT') return n.recipientRole === 'PATIENT' || !n.recipientId || n.recipientId === activePatientId;
    return true;
  });

  const unreadCount = relevantNotifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Live Activity Feed</h3>
                <p className="text-xs text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread broadcast alerts` : 'All events synchronized'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {relevantNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Sparkles className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-600" />
                <p className="text-sm font-medium">No activity notifications yet</p>
                <p className="text-xs mt-1">Actions & state mutations across the cluster appear here in real-time.</p>
              </div>
            ) : (
              relevantNotifications.map((notif) => (
                <NotificationCard key={notif.id} notif={notif} onMarkRead={() => markNotificationRead(notif.id)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center">
            <span className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400" /> MediFlow Real-Time WebSocket Channel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCard: React.FC<{ notif: Notification; onMarkRead: () => void }> = ({ notif, onMarkRead }) => {
  const getBadge = () => {
    switch (notif.type) {
      case 'EMERGENCY':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">Emergency</span>;
      case 'WARNING':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Warning</span>;
      case 'SUCCESS':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Success</span>;
      case 'TRANSACTION':
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Txn Event</span>;
      default:
        return <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">Info</span>;
    }
  };

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        notif.read
          ? 'bg-slate-900/40 border-slate-800/80 text-slate-300'
          : 'bg-slate-800/70 border-cyan-500/40 shadow-lg shadow-cyan-950/20 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getBadge()}
          <span className="text-[11px] font-mono text-slate-400">{notif.timestamp}</span>
        </div>
        {!notif.read && (
          <button
            onClick={onMarkRead}
            title="Mark as read"
            className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-cyan-950/50 rounded"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        )}
      </div>

      <h5 className="font-semibold text-sm mt-1.5">{notif.title}</h5>
      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>

      {notif.technicalDetails && (
        <div className="mt-2 text-[10px] font-mono bg-slate-950/80 p-2 rounded border border-slate-800 text-cyan-300 truncate">
          {notif.technicalDetails}
        </div>
      )}
    </div>
  );
};
