import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DomainSearch from './components/DomainSearch';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import RawResults from './components/RawResults';
import AiExplanation from './components/AiExplanation';
import HistorySidebar from './components/HistorySidebar';
import { queryDNS } from './api';
import { APIResponse, DomainHistoryEntry } from './types';

function App() {
  const [domain, setDomain] = useState('');
  const [selectedResult, setSelectedResult] = useState<APIResponse | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<APIResponse>({
    queryKey: ['dns', domain],
    queryFn: () => queryDNS(domain),
    enabled: false, // Don't auto-fetch, wait for user action
  });

  const handleSearch = async (searchDomain: string) => {
    setDomain(searchDomain);
    setSelectedResult(null);
    // Trigger the query
    refetch();
  };

  const handleSelectHistory = (entry: DomainHistoryEntry) => {
    // Reconstruct APIResponse from history entry
    const result: APIResponse = {
      domain: entry.domain,
      dnsResults: entry.rawDiagnostics.dnsResults,
      diagnostics: entry.rawDiagnostics.diagnostics,
      aiExplanation: entry.aiExplanation,
      timestamp: entry.timestamp,
    };
    setSelectedResult(result);
    setDomain(entry.domain);
  };

  // Use query result or selected history result
  const displayResult = selectedResult || data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DNS Doctor</h1>
              <p className="text-sm text-gray-600">AI-Powered DNS Diagnostics</p>
            </div>
            {domain && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                View History
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <DomainSearch onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-medium">Error:</p>
            <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cf-orange"></div>
            <p className="mt-4 text-gray-600">Analyzing DNS configuration...</p>
          </div>
        )}

        {/* Results */}
        {displayResult && !isLoading && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Diagnostic Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">
                    {displayResult.diagnostics.summary.errors}
                  </div>
                  <div className="text-sm text-red-800 mt-1">Errors</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">
                    {displayResult.diagnostics.summary.warnings}
                  </div>
                  <div className="text-sm text-yellow-800 mt-1">Warnings</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {displayResult.diagnostics.summary.info}
                  </div>
                  <div className="text-sm text-blue-800 mt-1">Info</div>
                </div>
              </div>
            </div>

            {/* AI Explanation */}
            <AiExplanation explanation={displayResult.aiExplanation} />

            {/* Diagnostics Panel */}
            <DiagnosticsPanel
              dnsResults={displayResult.dnsResults}
              issues={displayResult.diagnostics.issues}
            />

            {/* Raw Results */}
            <RawResults data={displayResult} />
          </div>
        )}

        {/* Empty State */}
        {!displayResult && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Get Started</h3>
              <p className="mt-2 text-gray-600">
                Enter a domain name above to analyze its DNS configuration and get AI-powered recommendations.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* History Sidebar */}
      <HistorySidebar
        domain={domain}
        onSelectHistory={handleSelectHistory}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

export default App;

