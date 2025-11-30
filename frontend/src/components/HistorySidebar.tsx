import { useEffect, useState } from 'react';
import { DomainHistoryEntry } from '../types';
import { getHistory } from '../api';

interface HistorySidebarProps {
  domain: string;
  onSelectHistory: (entry: DomainHistoryEntry) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistorySidebar({
  domain,
  onSelectHistory,
  isOpen,
  onClose,
}: HistorySidebarProps) {
  const [history, setHistory] = useState<DomainHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (domain && isOpen) {
      loadHistory();
    }
  }, [domain, isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory(domain);
      setHistory(response.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading history...</div>
          ) : error ? (
            <div className="text-red-600 py-8">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No history found for this domain</div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectHistory(entry);
                    onClose();
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-cf-orange hover:bg-orange-50 transition-colors"
                >
                  <div className="font-medium text-sm">{entry.domain}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(entry.timestamp)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {entry.rawDiagnostics?.diagnostics?.summary?.errors || 0} errors,{' '}
                    {entry.rawDiagnostics?.diagnostics?.summary?.warnings || 0} warnings
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

