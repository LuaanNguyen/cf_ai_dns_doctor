import { useState } from 'react';
import { AllDNSResults, DiagnosticIssue } from '../types';

interface DiagnosticsPanelProps {
  dnsResults: AllDNSResults;
  issues: DiagnosticIssue[];
}

export default function DiagnosticsPanel({ dnsResults, issues }: DiagnosticsPanelProps) {
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const toggleExpanded = (recordType: string) => {
    setExpanded((prev) => ({
      ...prev,
      [recordType]: !prev[recordType],
    }));
  };

  const getRecordStatus = (recordType: string): 'ok' | 'warning' | 'error' => {
    // Check if there are any issues for this record type
    const recordIssues = issues.filter((issue) => {
      const details = issue.details;
      return details?.recordType === recordType || issue.type.includes(recordType.toLowerCase());
    });

    if (recordIssues.some((i) => i.severity === 'error')) return 'error';
    if (recordIssues.some((i) => i.severity === 'warning')) return 'warning';
    return 'ok';
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusBadge = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      case 'ok':
        return 'OK';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4">DNS Records</h2>
      <div className="space-y-3">
        {Object.entries(dnsResults).map(([recordType, result]) => {
          const status = getRecordStatus(recordType);
          const isExpanded = expanded[recordType];
          const hasRecords = result.primaryRecords.length > 0;

          return (
            <div
              key={recordType}
              className={`border rounded-lg ${getStatusColor(status)}`}
            >
              <button
                onClick={() => toggleExpanded(recordType)}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{recordType}</span>
                  <span className={`px-2 py-1 text-xs rounded ${getStatusColor(status)}`}>
                    {getStatusBadge(status)}
                  </span>
                  {hasRecords && (
                    <span className="text-sm opacity-75">
                      ({result.primaryRecords.length} record{result.primaryRecords.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-current border-opacity-20 mt-2 pt-4">
                  {hasRecords ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Records:</h4>
                        <div className="space-y-2">
                          {result.primaryRecords.map((record, idx) => (
                            <div key={idx} className="bg-white bg-opacity-50 rounded p-2 text-sm font-mono">
                              <div className="flex justify-between">
                                <span className="font-semibold">{record.name}</span>
                                <span className="text-xs opacity-75">TTL: {record.TTL}s</span>
                              </div>
                              <div className="mt-1 break-all">{record.data}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {Object.keys(result.propagation).length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Propagation:</h4>
                          <div className="space-y-2">
                            {Object.entries(result.propagation).map(([resolver, propResult]) => (
                              <div
                                key={resolver}
                                className={`bg-white bg-opacity-50 rounded p-2 text-sm ${
                                  propResult.hasError ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">{propResult.resolver}</span>
                                  <span>
                                    {propResult.hasError ? '❌ Error' : `✓ ${propResult.records.length} record(s)`}
                                  </span>
                                </div>
                                {propResult.error && (
                                  <div className="mt-1 text-xs opacity-75">{propResult.error}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm opacity-75">No records found</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

