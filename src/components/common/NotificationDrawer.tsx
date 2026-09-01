import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Notification } from '../../types';
import { CheckCheck, X, Flame, Calendar, AlertTriangle, Sparkles } from 'lucide-react';

export const NotificationDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentWorkspace, setSelectedLead, setActiveView } = useWorkspace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const list = await api.getNotifications(currentWorkspace.id);
      setNotifications(list);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen, currentWorkspace?.id]);

  if (!isOpen) return null;

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.markNotificationRead(currentWorkspace.id, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead(currentWorkspace.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await api.markNotificationRead(currentWorkspace.id, notif.id);
    }
    if (notif.leadId) {
      const leads = await api.getLeads(currentWorkspace.id);
      const target = leads.find((l) => l.id === notif.leadId);
      if (target) {
        setSelectedLead(target);
        setActiveView('leads');
        onClose();
        return;
      }
    }
    if (notif.type === 'APPOINTMENT') {
      setActiveView('appointments');
      onClose();
      return;
    }
    if (notif.type === 'HOT_LEAD' || notif.type === 'FOLLOWUP_OVERDUE') {
      setActiveView('leads');
      onClose();
      return;
    }
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0a0a] border-l border-[#1a1a1a] h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#404040]">Activity Center</span>
            <h2 className="text-lg font-light text-white tracking-wide">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#c5a059] hover:bg-[#111111] rounded-sm transition border border-transparent hover:border-[#1a1a1a] flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark All Read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-[#737373] hover:text-white hover:bg-[#111111] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex border-b border-[#1a1a1a] bg-[#080808] px-5 py-2.5 text-xs gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`text-[10px] uppercase tracking-widest pb-1 transition ${
              filter === 'all'
                ? 'text-[#c5a059] border-b border-[#c5a059] font-medium'
                : 'text-[#737373] hover:text-[#e5e5e5]'
            }`}
          >
            All Logs ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`text-[10px] uppercase tracking-widest pb-1 transition ${
              filter === 'unread'
                ? 'text-[#c5a059] border-b border-[#c5a059] font-medium'
                : 'text-[#737373] hover:text-[#e5e5e5]'
            }`}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#141414] p-2">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#737373]">Loading activity events...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#737373]">No notifications present.</div>
          ) : (
            filtered.map((notif) => {
              const iconMap = {
                HOT_LEAD: <Flame className="w-4 h-4 text-rose-500" />,
                APPOINTMENT: <Calendar className="w-4 h-4 text-[#c5a059]" />,
                ESCALATION: <AlertTriangle className="w-4 h-4 text-orange-400" />,
                SYSTEM: <Sparkles className="w-4 h-4 text-sky-400" />,
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 rounded-sm transition cursor-pointer hover:bg-[#111111] space-y-1.5 ${
                    notif.isRead ? 'opacity-70 bg-transparent' : 'bg-[#0e0e0e] border-l-2 border-[#c5a059]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {iconMap[notif.type]}
                      <span className="text-xs font-light text-white tracking-wide">{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-[#737373] font-mono whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#737373] leading-relaxed pl-6">{notif.message}</p>
                  {!notif.isRead && (
                    <div className="pl-6 pt-1 flex justify-end">
                      <button
                        onClick={(e) => handleMarkRead(notif.id, e)}
                        className="text-[10px] uppercase tracking-wider text-[#c5a059] hover:underline"
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
