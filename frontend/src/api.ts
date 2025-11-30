import { APIResponse, HistoryResponse } from './types';

// API base URL - defaults to worker dev URL, can be overridden via env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Query DNS diagnostics for a domain
 */
export async function queryDNS(domain: string): Promise<APIResponse> {
  const response = await fetch(`${API_BASE_URL}/api/dns?domain=${encodeURIComponent(domain)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get domain history
 */
export async function getHistory(domain: string): Promise<HistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/dns/history?domain=${encodeURIComponent(domain)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

