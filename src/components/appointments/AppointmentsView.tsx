import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  CalendarDays,
  Clock,
  Video,
  User,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  RefreshCw
} from 'lucide-react';

export const AppointmentsView: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const { showToast } = useNotification();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await api.getAppointments(currentWorkspace.id);
      setAppointments(data);
    } catch (e) {
      console.warn('Failed to load appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentWorkspace?.id]);

  const handleUpdateStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const updated = await api.updateAppointment(currentWorkspace.id, id, { status });
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast({
        type: 'success',
        title: 'Appointment Updated',
        message: `Status marked as ${status}.`
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update failed', message: e.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#050505]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            Calendar & Consultations
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Booked Consultations</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              {appointments.length} Total
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Automated calendar booking slots synced across sales specialists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAppointments}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[#e5e5e5] hover:border-[#c5a059] text-[11px] uppercase tracking-wider transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c5a059]' : 'text-[#737373]'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Appointments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-[#737373] bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm">
            No consultations scheduled yet.
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-5 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#262626] transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-light text-white">{apt.leadName}</h3>
                    <p className="text-[11px] text-[#737373] mt-0.5 font-light">{apt.service}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm border ${
                      apt.status === 'CONFIRMED'
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                        : apt.status === 'COMPLETED'
                        ? 'bg-[#171717] text-[#c5a059] border-[#c5a059]/40'
                        : 'bg-rose-950/40 text-rose-400 border-rose-900/40'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-[#111111] border border-[#1a1a1a] space-y-2 text-xs font-light">
                  <div className="flex items-center gap-2 text-[#e5e5e5]">
                    <Clock className="w-3.5 h-3.5 text-[#c5a059]" />
                    <span>{new Date(apt.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#737373]">
                    <User className="w-3.5 h-3.5 text-[#737373]" />
                    <span>Specialist: {apt.assignedAgentName || 'Assigned Agent'}</span>
                  </div>
                  {apt.meetingUrl && (
                    <div className="flex items-center gap-2 text-[#c5a059] pt-1 border-t border-[#1a1a1a]">
                      <Video className="w-3.5 h-3.5 text-[#c5a059]" />
                      <a href={apt.meetingUrl} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 font-mono text-[11px]">
                        Google Meet Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#141414]">
                {apt.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                    className="px-2.5 py-1 rounded-sm bg-[#111111] hover:bg-[#171717] text-emerald-400 border border-emerald-900/40 text-[10px] uppercase tracking-wider transition"
                  >
                    Mark Done
                  </button>
                )}
                {apt.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                    className="px-2.5 py-1 rounded-sm bg-[#111111] hover:bg-[#171717] text-rose-400 border border-rose-900/40 text-[10px] uppercase tracking-wider transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
