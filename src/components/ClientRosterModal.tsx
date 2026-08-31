import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Check, Search, Users, ChevronRight } from 'lucide-react';
import { AthleteData } from '../types';

interface ClientRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Record<string, AthleteData>;
  onOpenDispatchForClients?: (selectedClientKeys: string[]) => void;
  onSelectClientDetail?: (client: AthleteData) => void;
  onOpenShareClientProgress?: (client: AthleteData) => void;
}

export const ClientRosterModal: React.FC<ClientRosterModalProps> = ({
  isOpen,
  onClose,
  clients,
  onOpenDispatchForClients,
  onSelectClientDetail,
  onOpenShareClientProgress,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => Object.keys(clients));
  const [filterBadge, setFilterBadge] = useState<string>('ALL');

  const clientList: AthleteData[] = Object.values(clients);

  const filteredClients = clientList.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.key.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterBadge === 'ALL') return true;
    if (filterBadge === 'PENDING') return client.badge?.includes('PENDING') || client.status === 'PENDING';
    if (filterBadge === 'PR') return client.badge?.includes('PR');
    if (filterBadge === 'COMPLETED') return client.badge?.includes('COMPLETED') || client.status === 'ACTIVE';
    return true;
  });

  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(clientList.map((c) => c.key));
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  const handleDispatchWorkoutClick = () => {
    if (selectedKeys.length === 0) return;
    if (onOpenDispatchForClients) {
      onOpenDispatchForClients(selectedKeys);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121214] text-zinc-900 dark:text-white rounded-2xl shadow-2xl border border-zinc-200/80 dark:border-white/10 flex flex-col max-h-[88vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="py-3 px-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#161618]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-800 dark:text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                Client Roster
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                {selectedKeys.length} of {clientList.length} Athletes Selected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-nude-close"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Compact Controls & Filters */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search athlete by name or handle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-black/50 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-500 text-xs rounded-xl pl-10 pr-9 py-2.5 focus:outline-none focus:border-stone-400 dark:focus:border-white/30 transition-colors shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-black/40 p-1 rounded-xl border border-zinc-200/80/80 dark:border-white/5">
              {(['ALL', 'PENDING', 'PR', 'COMPLETED'] as const).map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => setFilterBadge(badge)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    filterBadge === badge
                      ? 'bg-stone-900 dark:bg-white text-white dark:text-black font-bold shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {badge}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 cursor-pointer transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Inset Grouped Client List */}
          <div className="bg-white dark:bg-black/40 border border-zinc-200/80 dark:border-white/10 rounded-xl divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden shadow-xs">
            {filteredClients.map((client) => {
              const isSelected = selectedKeys.includes(client.key);
              return (
                <div
                  key={client.key}
                  onClick={() => toggleSelectKey(client.key)}
                  className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-zinc-100/70 dark:bg-white/[0.04]' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white text-white dark:text-black'
                          : 'border-zinc-300 dark:border-zinc-700 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>

                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {client.name}
                        </span>
                        {client.badge && (
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 border ${
                              client.badge.includes('PENDING')
                                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : client.badge.includes('PR')
                                ? 'bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {client.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                        {client.handle} &bull; {client.volume}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOpenShareClientProgress && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareClientProgress(client);
                        }}
                        className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs transition-colors cursor-pointer border border-zinc-200 dark:border-white/10"
                        title="Share Progress"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onSelectClientDetail && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClientDetail(client);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-800 dark:text-white rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer border border-zinc-200/80 dark:border-white/10 flex items-center gap-1"
                      >
                        <span>Logs</span>
                        <ChevronRight className="w-3 h-3 text-stone-400 dark:text-zinc-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredClients.length === 0 && (
              <div className="py-8 px-4 text-center">
                <Users className="w-8 h-8 text-stone-400 dark:text-zinc-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-zinc-800 dark:text-white">
                  No matching athletes found
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                  Try adjusting your search query or filter tags
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#161618] flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-800 dark:text-zinc-300 font-mono font-bold rounded-xl text-xs transition-colors cursor-pointer border border-zinc-200 dark:border-white/10"
          >
            Close
          </button>
          {onOpenDispatchForClients && (
            <button
              type="button"
              onClick={handleDispatchWorkoutClick}
              disabled={selectedKeys.length === 0}
              className="flex-1 py-2.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-mono font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              Dispatch ({selectedKeys.length})
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
