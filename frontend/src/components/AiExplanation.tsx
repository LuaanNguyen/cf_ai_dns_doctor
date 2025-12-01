import { AIExplanation } from "../types";

interface AiExplanationProps {
  explanation: AIExplanation;
}

export default function AiExplanation({ explanation }: AiExplanationProps) {
  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "bg-red-100 text-red-800 border-red-300";
    if (severity >= 5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return "Critical";
    if (severity >= 5) return "Warning";
    return "Info";
  };

  // Calculate overall health status
  const getOverallHealth = () => {
    if (!explanation.issues || explanation.issues.length === 0) {
      return { status: "excellent", color: "green", message: "All Good!" };
    }
    const criticalIssues = explanation.issues.filter((i) => i.severity >= 8).length;
    const warnings = explanation.issues.filter((i) => i.severity >= 5 && i.severity < 8).length;
    
    if (criticalIssues > 0) {
      return { status: "needs-attention", color: "red", message: "Action Required" };
    }
    if (warnings > 0) {
      return { status: "good", color: "yellow", message: "Mostly Good" };
    }
    return { status: "excellent", color: "green", message: "Looking Good" };
  };

  const health = getOverallHealth();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-6">AI Analysis</h2>

      {/* Enhanced Summary Section */}
      <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Quick Summary
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                health.color === "red" 
                  ? "bg-red-100 text-red-800" 
                  : health.color === "yellow"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {health.message}
              </span>
              {explanation.issues && explanation.issues.length > 0 && (
                <span className="text-sm text-gray-600">
                  {explanation.issues.length} issue{explanation.issues.length !== 1 ? "s" : ""} found
                </span>
              )}
            </div>
          </div>
        </div>
        
        {explanation.summary ? (
          <p className="text-gray-700 leading-relaxed text-base">
            {explanation.summary}
          </p>
        ) : (
          <p className="text-gray-700 leading-relaxed text-base">
            {explanation.issues && explanation.issues.length > 0
              ? `Your DNS configuration has ${explanation.issues.length} issue${explanation.issues.length !== 1 ? "s" : ""} that ${explanation.issues.length === 1 ? "needs" : "need"} attention. Review the details below for specific recommendations.`
              : "Your DNS configuration looks good! No critical issues detected."}
          </p>
        )}

        {/* Quick Stats */}
        {explanation.issues && explanation.issues.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-300 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600">
                {explanation.issues.filter((i) => i.severity >= 8).length} Critical
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="text-gray-600">
                {explanation.issues.filter((i) => i.severity >= 5 && i.severity < 8).length} Warnings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">
                {explanation.issues.filter((i) => i.severity < 5).length} Info
              </span>
            </div>
          </div>
        )}
      </div>

      {explanation.issues && explanation.issues.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-medium text-lg mb-3">Issues & Recommendations</h3>
          {explanation.issues.map((issue, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${getSeverityColor(
                issue.severity
              )}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{issue.issue}</h4>
                <span
                  className={`px-2 py-1 text-xs rounded ${getSeverityColor(
                    issue.severity
                  )}`}
                >
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
                      <li key={stepIdx} className="opacity-90">
                        {step}
                      </li>
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
