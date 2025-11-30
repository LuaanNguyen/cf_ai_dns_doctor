import { DomainHistoryEntry, APIResponse } from './types';

/**
 * Durable Object for storing domain diagnostic history
 * Each domain gets its own Durable Object instance
 */
export class DomainHistory {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handle HTTP requests to the Durable Object
   * Routes:
   * - POST /store - Store diagnostic results
   * - GET /history?domain= - Retrieve history for a domain
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return this.handleCORS(new Response(null, { status: 204 }));
    }

    try {
      if (request.method === 'POST' && path === '/store') {
        return await this.handleStore(request);
      } else if (request.method === 'GET' && path === '/history') {
        return await this.handleGetHistory(request);
      } else {
        return this.handleCORS(
          new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
    } catch (error) {
      console.error('Durable Object error:', error);
      return this.handleCORS(
        new Response(
          JSON.stringify({ error: 'Internal server error', message: String(error) }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }
  }

  /**
   * Store diagnostic results
   * POST /store
   * Body: { domain, rawDiagnostics, aiExplanation, timestamp }
   */
  private async handleStore(request: Request): Promise<Response> {
    const data: DomainHistoryEntry = await request.json();

    // Validate required fields
    if (!data.domain || !data.rawDiagnostics || !data.aiExplanation) {
      return this.handleCORS(
        new Response(
          JSON.stringify({ error: 'Missing required fields: domain, rawDiagnostics, aiExplanation' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }

    // Set timestamp if not provided
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }

    // Get existing history for this domain
    const historyKey = `history:${data.domain}`;
    const existingHistory = await this.state.storage.get<DomainHistoryEntry[]>(historyKey) || [];

    // Add new entry
    existingHistory.push(data);

    // Keep only last 50 entries per domain
    if (existingHistory.length > 50) {
      existingHistory.shift();
    }

    // Sort by timestamp (most recent first)
    existingHistory.sort((a, b) => b.timestamp - a.timestamp);

    // Store updated history
    await this.state.storage.put(historyKey, existingHistory);

    return this.handleCORS(
      new Response(
        JSON.stringify({ success: true, message: 'Stored successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  /**
   * Retrieve history for a domain
   * GET /history?domain=example.com
   */
  private async handleGetHistory(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return this.handleCORS(
        new Response(
          JSON.stringify({ error: 'Missing domain parameter' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }

    // Get history for this domain
    const historyKey = `history:${domain}`;
    const history = await this.state.storage.get<DomainHistoryEntry[]>(historyKey) || [];

    // Sort by timestamp (most recent first)
    history.sort((a, b) => b.timestamp - a.timestamp);

    return this.handleCORS(
      new Response(
        JSON.stringify({ domain, history }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  /**
   * Add CORS headers to response
   */
  private handleCORS(response: Response): Response {
    // Create new response with CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }
}

