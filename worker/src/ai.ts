import { DiagnosticResult, AllDNSResults, AIExplanation } from "./types";

// Environment interface for bindings
interface Env {
  AI: any; // Workers AI binding
  OPENAI_API_KEY?: string;
}

/**
 * Analyze DNS diagnostics using Workers AI (Llama 3.3)
 * @param diagnosticJSON - Combined diagnostic data
 * @param env - Worker environment with AI binding
 * @returns AI-generated explanation
 */
async function analyzeWithWorkersAI(
  diagnosticJSON: any,
  env: Env
): Promise<AIExplanation> {
  const systemPrompt = `You are a DNS expert. You take DNS diagnostic JSON and explain misconfigurations, why they matter, severity rating from 1 to 10, and list exact steps to fix each problem.

Return your response in the following JSON format:
{
  "summary": "Brief overall summary of the DNS configuration",
  "issues": [
    {
      "issue": "Description of the issue",
      "severity": 5,
      "explanation": "Why this issue matters",
      "steps": ["Step 1 to fix", "Step 2 to fix", ...]
    }
  ]
}

Be concise but thorough. Focus on actionable fixes.`;

  const userPrompt = `Analyze this DNS diagnostic data and provide recommendations:

${JSON.stringify(diagnosticJSON, null, 2)}`;

  try {
    const response = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
      }
    );

    // Parse the AI response
    const responseText = response.response || JSON.stringify(response);

    // Try to extract JSON from the response
    let parsed: AIExplanation;
    try {
      // Look for JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        parsed = {
          summary: responseText.substring(0, 200),
          issues: [
            {
              issue: "AI Analysis",
              severity: 5,
              explanation: responseText,
              steps: ["Review the explanation above"],
            },
          ],
        };
      }
    } catch (parseError) {
      // If parsing fails, create a fallback structure
      parsed = {
        summary: "AI analysis completed",
        issues: [
          {
            issue: "DNS Configuration Review",
            severity: 5,
            explanation: responseText,
            steps: ["Review the diagnostic results"],
          },
        ],
      };
    }

    return parsed;
  } catch (error) {
    console.error("Workers AI error:", error);
    throw error;
  }
}

/**
 * Analyze DNS diagnostics using OpenAI API (fallback)
 * @param diagnosticJSON - Combined diagnostic data
 * @param env - Worker environment with OpenAI API key
 * @returns AI-generated explanation
 */
async function analyzeWithOpenAI(
  diagnosticJSON: any,
  env: Env
): Promise<AIExplanation> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const systemPrompt = `You are a DNS expert. You take DNS diagnostic JSON and explain misconfigurations, why they matter, severity rating from 1 to 10, and list exact steps to fix each problem.

Return your response in the following JSON format:
{
  "summary": "Brief overall summary of the DNS configuration",
  "issues": [
    {
      "issue": "Description of the issue",
      "severity": 5,
      "explanation": "Why this issue matters",
      "steps": ["Step 1 to fix", "Step 2 to fix", ...]
    }
  ]
}

Be concise but thorough. Focus on actionable fixes.`;

  const userPrompt = `Analyze this DNS diagnostic data and provide recommendations:

${JSON.stringify(diagnosticJSON, null, 2)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || "{}";

    // Parse JSON response
    const parsed: AIExplanation = JSON.parse(responseText);
    return parsed;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

/**
 * Analyze DNS diagnostics with AI
 * Uses Workers AI (Llama 3.3) as primary, falls back to OpenAI if configured
 * @param dnsResults - DNS query results
 * @param diagnostics - Rule-based diagnostic results
 * @param env - Worker environment
 * @returns AI-generated explanation
 */
export async function analyzeWithAI(
  dnsResults: AllDNSResults,
  diagnostics: DiagnosticResult,
  env: Env
): Promise<AIExplanation> {
  // Combine all diagnostic data for AI analysis
  const diagnosticJSON = {
    dnsResults: {
      // Summarize DNS results (don't send all raw data to avoid token limits)
      recordTypes: Object.keys(dnsResults),
      recordCounts: Object.fromEntries(
        Object.entries(dnsResults).map(([type, result]) => [
          type,
          result.primaryRecords.length,
        ])
      ),
      hasPropagationIssues: Object.values(dnsResults).some((result) =>
        Object.values(result.propagation).some((p) => p.hasError)
      ),
    },
    diagnostics: {
      summary: diagnostics.summary,
      issues: diagnostics.issues.map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
      })),
    },
  };

  try {
    // Try Workers AI first (no API key needed)
    return await analyzeWithWorkersAI(diagnosticJSON, env);
  } catch (workersAIError) {
    console.warn("Workers AI failed, trying OpenAI fallback:", workersAIError);

    // Fallback to OpenAI if configured
    if (env.OPENAI_API_KEY) {
      try {
        return await analyzeWithOpenAI(diagnosticJSON, env);
      } catch (openAIError) {
        console.error("Both AI providers failed:", openAIError);
        // Return a fallback explanation
        return {
          summary:
            "AI analysis unavailable. Please review the diagnostic results below.",
          issues: diagnostics.issues.map((issue) => ({
            issue: issue.message,
            severity:
              issue.severity === "error"
                ? 8
                : issue.severity === "warning"
                ? 5
                : 3,
            explanation: `This is a ${issue.severity} level issue: ${issue.message}`,
            steps: [
              `Review the ${issue.type} issue and consult DNS documentation`,
            ],
          })),
        };
      }
    } else {
      // No OpenAI key, return fallback
      return {
        summary:
          "AI analysis unavailable. Please review the diagnostic results below.",
        issues: diagnostics.issues.map((issue) => ({
          issue: issue.message,
          severity:
            issue.severity === "error"
              ? 8
              : issue.severity === "warning"
              ? 5
              : 3,
          explanation: `This is a ${issue.severity} level issue: ${issue.message}`,
          steps: [
            `Review the ${issue.type} issue and consult DNS documentation`,
          ],
        })),
      };
    }
  }
}
