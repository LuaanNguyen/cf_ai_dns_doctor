import { useState } from 'react';

interface DomainSearchProps {
  onSearch: (domain: string) => void;
  isLoading: boolean;
}

export default function DomainSearch({ onSearch, isLoading }: DomainSearchProps) {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');

  /**
   * Extract domain from URL or return the input if it's already a domain
   * Handles: https://chatgpt.com, http://www.example.com/path, chatgpt.com, etc.
   */
  const extractDomain = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    try {
      // If it looks like a URL (starts with http:// or https://), parse it
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        let hostname = url.hostname;
        
        // Remove www. prefix if present
        if (hostname.startsWith('www.')) {
          hostname = hostname.substring(4);
        }
        
        return hostname;
      }

      // If it contains a path or query (has / or ?), try to extract domain
      if (trimmed.includes('/') || trimmed.includes('?')) {
        // Try to parse as URL by adding protocol if missing
        try {
          const url = new URL(trimmed.startsWith('//') ? `http:${trimmed}` : `http://${trimmed}`);
          let hostname = url.hostname;
          
          if (hostname.startsWith('www.')) {
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
            extracted = extracted.replace(/^https?:\/\//, '');
            // Remove www. prefix
            if (extracted.startsWith('www.')) {
              extracted = extracted.substring(4);
            }
            // Remove trailing path/query
            const pathIndex = extracted.indexOf('/');
            if (pathIndex > -1) {
              extracted = extracted.substring(0, pathIndex);
            }
            const queryIndex = extracted.indexOf('?');
            if (queryIndex > -1) {
              extracted = extracted.substring(0, queryIndex);
            }
            return extracted;
          }
        }
      }

      // Remove www. prefix if present
      if (trimmed.startsWith('www.')) {
        return trimmed.substring(4);
      }

      // Return as-is if it looks like a domain
      return trimmed;
    } catch {
      // If all parsing fails, return trimmed input
      return trimmed.replace(/^www\./, '');
    }
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain || domain.trim() === '') {
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
    setError('');

    // Extract domain in case user entered a URL
    const extractedDomain = extractDomain(domain);
    const trimmedDomain = extractedDomain.trim();
    
    if (!validateDomain(trimmedDomain)) {
      setError('Please enter a valid domain name or URL (e.g., example.com or https://example.com)');
      return;
    }

    onSearch(trimmedDomain);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Automatically extract domain from URL if user pastes a URL
              const extractedDomain = extractDomain(inputValue);
              setDomain(extractedDomain);
              setError('');
            }}
            onPaste={(e) => {
              // Handle paste events to extract domain from URLs
              const pastedText = e.clipboardData.getData('text');
              const extractedDomain = extractDomain(pastedText);
              if (extractedDomain !== pastedText.trim()) {
                e.preventDefault();
                setDomain(extractedDomain);
                setError('');
              }
            }}
            placeholder="Enter domain name or URL (e.g., example.com or https://example.com)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cf-orange focus:border-transparent"
            disabled={isLoading}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !domain.trim()}
          className="px-6 py-3 bg-cf-orange text-white rounded-lg font-medium hover:bg-cf-orange-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze DNS'}
        </button>
      </form>
    </div>
  );
}


