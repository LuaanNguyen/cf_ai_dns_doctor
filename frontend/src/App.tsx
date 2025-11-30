import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import DomainSearch from "./components/DomainSearch";
import DiagnosticsPanel from "./components/DiagnosticsPanel";
import RawResults from "./components/RawResults";
import AiExplanation from "./components/AiExplanation";
import HistorySidebar from "./components/HistorySidebar";
import { queryDNS } from "./api";
import { APIResponse, DomainHistoryEntry } from "./types";

function App() {
  const [domain, setDomain] = useState("");
  const [selectedResult, setSelectedResult] = useState<APIResponse | null>(
    null
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery<APIResponse>({
    queryKey: ["dns", domain],
    queryFn: () => queryDNS(domain),
    enabled: false, // Don't auto-fetch, wait for user action
  });

  const handleSearch = async (searchDomain: string) => {
    setDomain(searchDomain);
    setSelectedResult(null);
    // Trigger the query
    refetch();
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <div className="bg-white">
      {/* Floating History Button */}
      {domain && (
        <button
          onClick={() => setHistoryOpen(true)}
          className="fixed top-4 right-4 z-50 px-4 py-2 text-sm bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-colors"
        >
          History
        </button>
      )}

      {/* Landing Page Section - Full viewport height, stays in place */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Animated Waves Background */}
        <div className="absolute inset-0 wave-background">
          <svg
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <pattern
                id="grid1"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#bfdbfe"
                  strokeWidth="0.5"
                  opacity="0.6"
                />
              </pattern>
              <linearGradient
                id="waveGradient1"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#bfdbfe" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M0,350 Q200,250 400,350 T800,350 T1200,350 L1200,800 L0,800 Z"
              fill="url(#waveGradient1)"
            />
            <path
              d="M0,350 Q200,250 400,350 T800,350 T1200,350 L1200,800 L0,800 Z"
              fill="url(#grid1)"
              opacity="0.4"
            />
          </svg>
          <svg
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <pattern
                id="grid2"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              </pattern>
              <linearGradient
                id="waveGradient2"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path
              d="M0,450 Q300,550 600,450 T1200,450 L1200,800 L0,800 Z"
              fill="url(#waveGradient2)"
            />
            <path
              d="M0,450 Q300,550 600,450 T1200,450 L1200,800 L0,800 Z"
              fill="url(#grid2)"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Content - Centered */}
        <div className="relative z-10 w-full max-w-3xl px-4">
          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4 text-center">
            DNS Doctor
          </h1>
          <p className="text-xl font-medium text-gray-600 mb-12 text-center">
            AI-powered DNS Troubleshooting Engine, built with{" "}
            <span className="font-bold bg-gradient-to-r from-orange-400 to-orange-600 inline-block text-transparent bg-clip-text">
              Cloudflare
            </span>
          </p>

          {/* Search Box */}
          <div className="relative ">
            {/* Search Component */}
            <DomainSearch onSearch={handleSearch} isLoading={isLoading} />

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-medium">Error:</p>
                <p>
                  {error instanceof Error
                    ? error.message
                    : "An unknown error occurred"}
                </p>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="mt-6 flex flex-col items-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cf-orange"></div>
                <p className="mt-4 text-gray-600">
                  Analyzing DNS configuration...
                </p>
              </div>
            )}

            {/* Scroll to Results Button */}
            {displayResult && !isLoading && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={scrollToResults}
                  className="px-8 py-4 bg-cf-orange text-white rounded-xl font-medium hover:bg-cf-orange-dark transition-all shadow-lg flex items-center gap-2 hover:scale-105 animate-bounce"
                >
                  <span>View Analysis</span>
                  <svg
                    className="w-5 h-5 animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section - Scrollable below */}
      <main className="relative z-[5] bg-white pt-20">
        <div
          ref={resultsRef}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Results */}
          {displayResult && !isLoading && (
            <div className="space-y-6 pb-12">
              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  Diagnostic Summary
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-xl">
                    <div className="text-3xl font-bold text-red-600">
                      {displayResult.diagnostics.summary.errors}
                    </div>
                    <div className="text-sm text-red-800 mt-1">Errors</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-3xl font-bold text-yellow-600">
                      {displayResult.diagnostics.summary.warnings}
                    </div>
                    <div className="text-sm text-yellow-800 mt-1">Warnings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
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
        </div>
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
