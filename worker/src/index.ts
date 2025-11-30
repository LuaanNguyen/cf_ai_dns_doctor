import { queryDNSWithPropagation } from './dns';
import { analyzeDNS } from './diagnose';
import { analyzeWithAI } from './ai';
import { DomainHistory } from './durable';
import { DOMAIN_REGEX } from './constants';
import { APIResponse } from './types';

// Environment interface
interface Env {
  DOMAIN_HISTORY: DurableObjectNamespace;
  AI: any;
  OPENAI_API_KEY?: string;
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response: Response): Response {
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

/**
 * Handle CORS preflight requests
 */
function handleCORS(): Response {
  return addCORSHeaders(new Response(null, { status: 204 }));
}

/**
 * Validate domain format
 */
function validateDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') {
    return false;
  }
  // Remove trailing dot if present
  const normalizedDomain = domain.trim().replace(/\.$/, '');
  return DOMAIN_REGEX.test(normalizedDomain);
}

/**
 * Main DNS diagnostic endpoint
 * GET /api/dns?domain=example.com
 */
async function handleDNSDiagnostic(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  // Validate domain parameter
  if (!domain) {
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Missing domain parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  // Validate domain format
  if (!validateDomain(domain)) {
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Invalid domain format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  try {
    // Step 1: Query DNS records with propagation checks
    const dnsResults = await queryDNSWithPropagation(domain);

    // Step 2: Run rule-based analysis
    const diagnostics = await analyzeDNS(dnsResults, domain);

    // Step 3: Get AI explanation
    const aiExplanation = await analyzeWithAI(dnsResults, diagnostics, env);

    // Step 4: Store results in Durable Object
    const timestamp = Date.now();
    const historyEntry = {
      domain,
      rawDiagnostics: {
        dnsResults,
        diagnostics,
      },
      aiExplanation,
      timestamp,
    };

    // Get Durable Object ID for this domain
    const id = env.DOMAIN_HISTORY.idFromName(domain);
    const stub = env.DOMAIN_HISTORY.get(id);

    // Store asynchronously (don't wait for it)
    stub.fetch('http://do/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyEntry),
    }).catch((error) => {
      console.error('Failed to store history:', error);
      // Don't fail the request if storage fails
    });

    // Step 5: Return combined results
    const response: APIResponse = {
      domain,
      dnsResults,
      diagnostics,
      aiExplanation,
      timestamp,
    };

    return addCORSHeaders(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (error) {
    console.error('DNS diagnostic error:', error);
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error),
        }),
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
 * POST /api/dns/store
 */
async function handleStore(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Missing domain parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  try {
    const data = await request.json();
    const id = env.DOMAIN_HISTORY.idFromName(domain);
    const stub = env.DOMAIN_HISTORY.get(id);

    const response = await stub.fetch('http://do/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return addCORSHeaders(response);
  } catch (error) {
    console.error('Store error:', error);
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
}

/**
 * Get domain history
 * GET /api/dns/history?domain=example.com
 */
async function handleHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return addCORSHeaders(
      new Response(
        JSON.stringify({ error: 'Missing domain parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  try {
    const id = env.DOMAIN_HISTORY.idFromName(domain);
    const stub = env.DOMAIN_HISTORY.get(id);

    const response = await stub.fetch(`http://do/history?domain=${encodeURIComponent(domain)}`, {
      method: 'GET',
    });

    return addCORSHeaders(response);
  } catch (error) {
    console.error('History error:', error);
    return addCORSHeaders(
      new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
}

/**
 * Main worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Route requests
    if (path === '/api/dns') {
      if (request.method === 'GET') {
        return handleDNSDiagnostic(request, env);
      } else if (request.method === 'POST' && url.searchParams.get('store') !== null) {
        return handleStore(request, env);
      }
    } else if (path === '/api/dns/store') {
      if (request.method === 'POST') {
        return handleStore(request, env);
      }
    } else if (path === '/api/dns/history') {
      if (request.method === 'GET') {
        return handleHistory(request, env);
      }
    }

    // 404 for unknown routes
    return addCORSHeaders(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  },
};

// Export Durable Object class
export { DomainHistory };

