import { useState } from "react";

interface DomainSearchProps {
  onSearch: (domain: string) => void;
  isLoading: boolean;
}

export default function DomainSearch({
  onSearch,
  isLoading,
}: DomainSearchProps) {
  const [domain, setDomain] = useState("");
  const [error, setError] = useState("");

  /**
   * Extract domain from URL or return the input if it's already a domain
   * Handles: https://chatgpt.com, http://www.example.com/path, chatgpt.com, etc.
   */
  const extractDomain = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";

    try {
      // If it looks like a URL (starts with http:// or https://), parse it
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        let hostname = url.hostname;

        // Remove www. prefix if present
        if (hostname.startsWith("www.")) {
          hostname = hostname.substring(4);
        }

        return hostname;
      }

      // If it contains a path or query (has / or ?), try to extract domain
      if (trimmed.includes("/") || trimmed.includes("?")) {
        // Try to parse as URL by adding protocol if missing
        try {
          const url = new URL(
            trimmed.startsWith("//") ? `http:${trimmed}` : `http://${trimmed}`
          );
          let hostname = url.hostname;

          if (hostname.startsWith("www.")) {
            hostname = hostname.substring(4);
          }

          return hostname;
        } catch {
          // If URL parsing fails, try to extract domain manually
          // Simple pattern: find domain-like string (word.word format)
          const domainPattern = /([a-z0-9][a-z0-9.-]*\.[a-z]{2,})/i;
          const match = trimmed.match(domainPattern);
          if (match && match[1]) {
            let extracted = match[1].toLowerCase();
            // Remove protocol if present
            extracted = extracted.replace(/^https?:\/\//, "");
            // Remove www. prefix
            if (extracted.startsWith("www.")) {
              extracted = extracted.substring(4);
            }
            // Remove trailing path/query
            const pathIndex = extracted.indexOf("/");
            if (pathIndex > -1) {
              extracted = extracted.substring(0, pathIndex);
            }
            const queryIndex = extracted.indexOf("?");
            if (queryIndex > -1) {
              extracted = extracted.substring(0, queryIndex);
            }
            return extracted;
          }
        }
      }

      // Remove www. prefix if present
      if (trimmed.startsWith("www.")) {
        return trimmed.substring(4);
      }

      // Return as-is if it looks like a domain
      return trimmed;
    } catch {
      // If all parsing fails, return trimmed input
      return trimmed.replace(/^www\./, "");
    }
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain || domain.trim() === "") {
      return false;
    }
    // Basic domain validation - simplified regex to avoid nested quantifier issues
    const trimmed = domain.trim();
    // Check for basic domain format: at least one label, dot, and TLD
    const domainRegex = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;
    return domainRegex.test(trimmed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Extract domain in case user entered a URL
    const extractedDomain = extractDomain(domain);
    const trimmedDomain = extractedDomain.trim();

    if (!validateDomain(trimmedDomain)) {
      setError(
        "Please enter a valid domain name or URL (e.g., example.com or https://example.com)"
      );
      return;
    }

    onSearch(trimmedDomain);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Automatically extract domain from URL if user pastes a URL
              const extractedDomain = extractDomain(inputValue);
              setDomain(extractedDomain);
              setError("");
            }}
            onPaste={(e) => {
              // Handle paste events to extract domain from URLs
              const pastedText = e.clipboardData.getData("text");
              const extractedDomain = extractDomain(pastedText);
              if (extractedDomain !== pastedText.trim()) {
                e.preventDefault();
                setDomain(extractedDomain);
                setError("");
              }
            }}
            placeholder="Paste a URL or enter a domain name..."
            className="w-full px-6 py-5 pr-32 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-cf-orange focus:border-cf-orange bg-white/90 backdrop-blur-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !domain.trim()}
            className="absolute right-2 px-6 py-3 bg-cf-orange text-white rounded-xl font-medium hover:bg-cf-orange-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              "Analyze"
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
        )}
      </form>
    </div>
  );
}
