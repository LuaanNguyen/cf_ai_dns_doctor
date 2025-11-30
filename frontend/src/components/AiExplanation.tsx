import { AIExplanation } from '../types';

interface AiExplanationProps {
  explanation: AIExplanation;
}

export default function AiExplanation({ explanation }: AiExplanationProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (severity >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Critical';
    if (severity >= 5) return 'Warning';
    return 'Info';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-4">AI Analysis</h2>

      {explanation.summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">Summary</h3>
          <p className="text-gray-700">{explanation.summary}</p>
        </div>
      )}

      {explanation.issues && explanation.issues.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium text-lg mb-3">Issues & Recommendations</h3>
          {explanation.issues.map((issue, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{issue.issue}</h4>
                <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(issue.severity)}`}>
                  {getSeverityLabel(issue.severity)} ({issue.severity}/10)
                </span>
              </div>

              {issue.explanation && (
                <p className="mb-3 opacity-90">{issue.explanation}</p>
              )}

              {issue.steps && issue.steps.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Steps to Fix:</h5>
                  <ol className="list-decimal list-inside space-y-1">
                    {issue.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="opacity-90">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-800">
          <p>No issues detected. DNS configuration looks good!</p>
        </div>
      )}
    </div>
  );
}

