import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import { Lead, LeadStatus, LeadTemperature } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { TemperatureBadge, StatusPill, SourceBadge } from '../common/StatusPills';
import { LeadDetailDrawer } from './LeadDetailDrawer';
import { CreateLeadModal } from './CreateLeadModal';
import {
  Search,
  Filter,
  Columns,
  List,
  Plus,
  Flame,
  ArrowUpDown,
  Tag,
  CheckSquare,
  Square,
  Download,
} from 'lucide-react';

export const LeadsView: React.FC = () => {
  const { currentWorkspace, selectedLead, setSelectedLead } = useWorkspace();
  const { showToast } = useNotification();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [tempFilter, setTempFilter] = useState<'ALL' | LeadTemperature>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeadStatus>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'date_desc' | 'name_asc'>('score_desc');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchLeads = async () => {
    if (!currentWorkspace?.id) return;
    try {
      setLoading(true);
      const data = await api.getLeads(currentWorkspace.id);
      setLeads(data);
    } catch (e) {
      console.warn('Failed to load leads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentWorkspace?.id]);

  // Filter & Sort computation
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matches =
            lead.name.toLowerCase().includes(term) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term)) ||
            (lead.service && lead.service.toLowerCase().includes(term)) ||
            (lead.location && lead.location.toLowerCase().includes(term)) ||
            lead.tags.some((t) => t.toLowerCase().includes(term));
          if (!matches) return false;
        }

        // Temp
        if (tempFilter !== 'ALL' && lead.temperature !== tempFilter) return false;

        // Status
        if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;

        // Source
        if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.score - a.score;
        if (sortBy === 'score_asc') return a.score - b.score;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [leads, searchTerm, tempFilter, statusFilter, sourceFilter, sortBy]);

  // Selection handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    try {
      await api.bulkStatus(currentWorkspace.id, selectedIds, newStatus);
      showToast({
        type: 'success',
        title: 'Bulk Status Updated',
        message: `Updated status for ${selectedIds.length} leads to ${newStatus}.`
      });
      setSelectedIds([]);
      fetchLeads();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Bulk update failed', message: e.message });
    }
  };

  const handleBulkTagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTagInput.trim()) return;
    try {
      await api.bulkTag(currentWorkspace.id, selectedIds, bulkTagInput.trim());
      showToast({
        type: 'success',
        title: 'Bulk Tags Applied',
        message: `Tagged ${selectedIds.length} leads with "${bulkTagInput.trim()}".`
      });
      setShowBulkTagModal(false);
      setBulkTagInput('');
      setSelectedIds([]);
      fetchLeads();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Bulk tagging failed', message: e.message });
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Source', 'Status', 'Temperature', 'Score', 'Service', 'Location', 'Budget', 'Created'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.source}"`,
      l.status,
      l.temperature,
      l.score,
      `"${l.service || ''}"`,
      `"${l.location || ''}"`,
      `"${l.budget || ''}"`,
      l.createdAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${currentWorkspace.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kanban Columns configuration in Elegant Dark theme
  const kanbanColumns: { id: LeadStatus; title: string; color: string }[] = [
    { id: 'NEW', title: 'New Inbound', color: 'border-[#1a1a1a] bg-[#0a0a0a]' },
    { id: 'CONTACTED', title: 'Contacted', color: 'border-[#1a1a1a] bg-[#0a0a0a]' },
    { id: 'QUALIFIED', title: 'AI Qualified', color: 'border-emerald-950/60 bg-[#0a0a0a]' },
    { id: 'APPOINTMENT_BOOKED', title: 'Booked', color: 'border-[#c5a059]/40 bg-[#0a0a0a]' },
    { id: 'NEGOTIATION', title: 'Negotiation', color: 'border-amber-950/60 bg-[#0a0a0a]' },
    { id: 'WON', title: 'Closed Won', color: 'border-emerald-800/40 bg-emerald-950/20' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 bg-[#050505]">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] block mb-1">
            CRM & Pipeline Directory
          </span>
          <h1 className="text-3xl font-extralight text-white tracking-tight flex items-center gap-3">
            <span>Leads CRM</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-sm bg-[#111111] text-[#c5a059] border border-[#262626]">
              {filteredLeads.length} leads
            </span>
          </h1>
          <p className="text-xs text-[#737373] mt-1 font-light">
            Automated multi-channel scoring, qualification stages, and real-time CRM updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-[#171717] text-[#c5a059] font-medium border border-[#262626]' : 'text-[#737373] hover:text-[#e5e5e5]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-[#171717] text-[#c5a059] font-medium border border-[#262626]' : 'text-[#737373] hover:text-[#e5e5e5]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-[#111111] border border-[#262626] text-[#e5e5e5] hover:border-[#c5a059] text-[11px] uppercase tracking-wider transition font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, phone, tags, location..."
            className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm pl-9 pr-3 py-2 text-xs text-[#e5e5e5] placeholder-[#737373] focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Temperature */}
          <div className="flex items-center gap-1 bg-[#111111] px-2.5 py-1.5 rounded-sm border border-[#1a1a1a]">
            <Flame className="w-3 h-3 text-rose-400" />
            <select
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value as any)}
              className="bg-transparent text-[#e5e5e5] text-xs focus:outline-none uppercase tracking-wider text-[11px]"
            >
              <option value="ALL" className="bg-[#0a0a0a]">All Temps</option>
              <option value="HOT" className="bg-[#0a0a0a]">🔥 HOT (70-100)</option>
              <option value="WARM" className="bg-[#0a0a0a]">☀️ WARM (40-69)</option>
              <option value="COLD" className="bg-[#0a0a0a]">❄️ COLD (0-39)</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-[#111111] px-2.5 py-1.5 rounded-sm border border-[#1a1a1a]">
            <Filter className="w-3 h-3 text-[#c5a059]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-[#e5e5e5] text-xs focus:outline-none uppercase tracking-wider text-[11px]"
            >
              <option value="ALL" className="bg-[#0a0a0a]">All Stages</option>
              <option value="NEW" className="bg-[#0a0a0a]">New</option>
              <option value="CONTACTED" className="bg-[#0a0a0a]">Contacted</option>
              <option value="QUALIFIED" className="bg-[#0a0a0a]">Qualified</option>
              <option value="APPOINTMENT_BOOKED" className="bg-[#0a0a0a]">Booked</option>
              <option value="NEGOTIATION" className="bg-[#0a0a0a]">Negotiation</option>
              <option value="WON" className="bg-[#0a0a0a]">Closed Won</option>
              <option value="LOST" className="bg-[#0a0a0a]">Lost</option>
              <option value="REACTIVATION" className="bg-[#0a0a0a]">Reactivation</option>
            </select>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1 bg-[#111111] px-2.5 py-1.5 rounded-sm border border-[#1a1a1a]">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-[#e5e5e5] text-xs focus:outline-none uppercase tracking-wider text-[11px]"
            >
              <option value="ALL" className="bg-[#0a0a0a]">All Channels</option>
              <option value="Website Widget" className="bg-[#0a0a0a]">Website Widget</option>
              <option value="WhatsApp" className="bg-[#0a0a0a]">WhatsApp</option>
              <option value="Meta Ads" className="bg-[#0a0a0a]">Meta Ads</option>
              <option value="Gmail" className="bg-[#0a0a0a]">Gmail</option>
              <option value="Referral" className="bg-[#0a0a0a]">Referral</option>
              <option value="Webhook" className="bg-[#0a0a0a]">Webhook</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-[#111111] px-2.5 py-1.5 rounded-sm border border-[#1a1a1a]">
            <ArrowUpDown className="w-3 h-3 text-[#737373]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[#e5e5e5] text-xs focus:outline-none uppercase tracking-wider text-[11px]"
            >
              <option value="score_desc" className="bg-[#0a0a0a]">Highest Score</option>
              <option value="score_asc" className="bg-[#0a0a0a]">Lowest Score</option>
              <option value="date_desc" className="bg-[#0a0a0a]">Newest First</option>
              <option value="name_asc" className="bg-[#0a0a0a]">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3 rounded-sm bg-[#0a0a0a] border border-[#c5a059]/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#c5a059]">
            <CheckSquare className="w-4 h-4 text-[#c5a059]" />
            <span>{selectedIds.length} leads selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setShowBulkTagModal(true)}
              className="px-3 py-1.5 rounded-sm bg-[#111111] hover:bg-[#171717] border border-[#262626] text-[#e5e5e5] font-medium flex items-center gap-1 transition uppercase tracking-wider text-[10px]"
            >
              <Tag className="w-3 h-3 text-[#c5a059]" />
              <span>Add Tag</span>
            </button>

            <select
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value as LeadStatus);
              }}
              defaultValue=""
              className="bg-[#111111] text-[#e5e5e5] border border-[#262626] rounded-sm px-2.5 py-1.5 font-medium focus:outline-none uppercase tracking-wider text-[10px]"
            >
              <option value="" disabled>
                Move Stage...
              </option>
              <option value="CONTACTED" className="bg-[#0a0a0a]">Mark Contacted</option>
              <option value="QUALIFIED" className="bg-[#0a0a0a]">Mark Qualified</option>
              <option value="APPOINTMENT_BOOKED" className="bg-[#0a0a0a]">Book Appointment</option>
              <option value="WON" className="bg-[#0a0a0a]">Mark Won</option>
              <option value="LOST" className="bg-[#0a0a0a]">Mark Lost</option>
            </select>

            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-sm text-[#737373] hover:text-white font-medium text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* VIEW: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-6">
          {kanbanColumns.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-sm border ${col.color} p-3 space-y-3 min-w-[240px] flex flex-col max-h-[780px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1 border-b border-[#1a1a1a] pb-2">
                  <h3 className="text-[10px] uppercase tracking-widest font-medium text-[#e5e5e5]">{col.title}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#111111] text-[#737373] border border-[#1a1a1a]">
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {colLeads.length === 0 ? (
                    <div className="py-8 text-center text-[10px] uppercase tracking-widest text-[#404040] border border-dashed border-[#1a1a1a] rounded-sm">
                      Empty
                    </div>
                  ) : (
                    colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-sm border transition cursor-pointer space-y-2 group relative ${
                          lead.temperature === 'HOT'
                            ? 'bg-[#0f0a0a] border-rose-900/60 hover:border-rose-700'
                            : 'bg-[#111111] border-[#1a1a1a] hover:border-[#262626]'
                        }`}
                      >
                        {/* Card Header: Score, Temp, Checkbox */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleToggleSelect(lead.id, e)}
                              className="text-[#737373] hover:text-[#c5a059]"
                            >
                              {selectedIds.includes(lead.id) ? (
                                <CheckSquare className="w-3 h-3 text-[#c5a059]" />
                              ) : (
                                <Square className="w-3 h-3" />
                              )}
                            </button>
                            <TemperatureBadge temperature={lead.temperature} score={lead.score} size="sm" />
                          </div>
                          <SourceBadge source={lead.source} />
                        </div>

                        {/* Name & Service */}
                        <div>
                          <h4 className="text-xs font-light text-white group-hover:text-[#c5a059] transition leading-snug line-clamp-1">
                            {lead.name}
                          </h4>
                          <p className="text-[11px] text-[#737373] mt-0.5 truncate font-light">{lead.service || 'Consultation'}</p>
                        </div>

                        {/* Budget & Location */}
                        <div className="flex items-center justify-between text-[10px] text-[#737373] pt-1 border-t border-[#1a1a1a]">
                          <span className="font-mono text-emerald-500">{lead.budget || 'Custom'}</span>
                          <span className="truncate max-w-[100px] font-light">{lead.location || 'Local'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: DATA TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-sm bg-[#0a0a0a] border border-[#1a1a1a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-[#404040] border-b border-[#1a1a1a] bg-[#080808]">
                  <th className="py-3 px-4 w-8">
                    <button onClick={handleSelectAll} className="text-[#737373] hover:text-[#c5a059]">
                      {selectedIds.length > 0 && selectedIds.length === filteredLeads.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#c5a059]" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 font-medium">Lead Contact</th>
                  <th className="py-3 px-3 font-medium">Score / Temp</th>
                  <th className="py-3 px-3 font-medium">Stage</th>
                  <th className="py-3 px-3 font-medium">Service</th>
                  <th className="py-3 px-3 font-medium">Budget</th>
                  <th className="py-3 px-3 font-medium">Channel</th>
                  <th className="py-3 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414] text-xs">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#737373]">
                      No leads match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isSelected = selectedIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`hover:bg-[#0f0f0f] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#141414]' : ''
                        }`}
                      >
                        <td className="py-3 px-4" onClick={(e) => handleToggleSelect(lead.id, e)}>
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#c5a059]" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-[#404040]" />
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-light text-white group-hover:text-[#c5a059] transition">
                            {lead.name}
                          </div>
                          <div className="text-[11px] text-[#737373] font-light">
                            {lead.phone && <span>{lead.phone}</span>}
                            {lead.location && <span> • {lead.location}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <TemperatureBadge temperature={lead.temperature} score={lead.score} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          <StatusPill status={lead.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 text-[#e5e5e5] font-light">{lead.service || 'General'}</td>
                        <td className="py-3 px-3 font-mono text-emerald-500">
                          {lead.budget || 'Custom'}
                        </td>
                        <td className="py-3 px-3">
                          <SourceBadge source={lead.source} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            className="px-2.5 py-1 rounded-sm bg-[#111111] hover:bg-[#171717] text-[#c5a059] border border-[#262626] text-[10px] uppercase tracking-wider transition"
                          >
                            Details &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setSelectedLead(updated);
        }}
      />

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newLead) => {
          setLeads((prev) => [newLead, ...prev]);
          setSelectedLead(newLead);
        }}
      />

      {/* Bulk Tagging Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm w-full max-w-sm p-6 shadow-2xl space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-[#737373]">Tag Management</span>
            <h3 className="font-light text-base text-white">Add Tag to {selectedIds.length} Selected Leads</h3>
            <form onSubmit={handleBulkTagSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                placeholder="e.g. VIP Priority, High Intent..."
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-sm px-3 py-2 text-xs text-[#e5e5e5] focus:outline-none focus:border-[#c5a059]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkTagModal(false)}
                  className="px-3 py-1.5 text-xs text-[#737373] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-sm bg-[#c5a059] hover:bg-[#b08e4d] text-black text-[11px] uppercase tracking-wider font-semibold"
                >
                  Apply Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
