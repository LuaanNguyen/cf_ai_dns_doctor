import { DNSResponse, DNSRecord, ResolverResult, DNSQueryResult, AllDNSResults } from './types';
import { DNS_RECORD_TYPES, RESOLVERS, QUERY_RECORD_TYPES } from './constants';

/**
 * Query DNS records using DNS-over-HTTPS (DoH)
 * @param domain - Domain name to query
 * @param recordType - DNS record type (e.g., 'A', 'AAAA', 'MX')
 * @param resolver - DoH resolver URL
 * @returns DNS response or null if query fails
 */
export async function queryDNS(
  domain: string,
  recordType: string,
  resolver: string
): Promise<DNSResponse | null> {
  try {
    const typeNumber = DNS_RECORD_TYPES[recordType as keyof typeof DNS_RECORD_TYPES];
    if (!typeNumber) {
      throw new Error(`Invalid record type: ${recordType}`);
    }

    // Build query URL - different resolvers use different formats
    let queryUrl: string;
    if (resolver === RESOLVERS.GOOGLE) {
      // Google uses query parameters
      queryUrl = `${resolver}?name=${encodeURIComponent(domain)}&type=${typeNumber}`;
    } else {
      // Cloudflare and Quad9 use query parameters with different format
      queryUrl = `${resolver}?name=${encodeURIComponent(domain)}&type=${typeNumber}`;
    }

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DNSResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`DNS query failed for ${domain} (${recordType}) via ${resolver}:`, error);
    return null;
  }
}

/**
 * Query all required DNS record types for a domain
 * Uses Cloudflare 1.1.1.1 as the primary resolver
 * @param domain - Domain name to query
 * @returns All DNS query results organized by record type
 */
export async function queryAllRecords(domain: string): Promise<AllDNSResults> {
  const results: AllDNSResults = {};

  // Query all record types in parallel using primary resolver (Cloudflare)
  const queries = QUERY_RECORD_TYPES.map(async (recordType) => {
    const response = await queryDNS(domain, recordType, RESOLVERS.CLOUDFLARE);
    const records: DNSRecord[] = response?.Answer || [];

    results[recordType] = {
      recordType,
      primaryRecords: records,
      propagation: {},
    };
  });

  await Promise.all(queries);

  return results;
}

/**
 * Check DNS record propagation across multiple resolvers
 * @param domain - Domain name to check
 * @param recordType - DNS record type to check
 * @returns Propagation results from all resolvers
 */
export async function checkPropagation(
  domain: string,
  recordType: string
): Promise<{ [resolver: string]: ResolverResult }> {
  const propagation: { [resolver: string]: ResolverResult } = {};

  // Check propagation across all resolvers in parallel
  const checks = Object.entries(RESOLVERS).map(async ([name, resolverUrl]) => {
    const response = await queryDNS(domain, recordType, resolverUrl);
    
    if (!response) {
      propagation[resolverUrl] = {
        resolver: name,
        records: [],
        hasError: true,
        error: 'Query failed',
      };
      return;
    }

    const records: DNSRecord[] = response.Answer || [];
    propagation[resolverUrl] = {
      resolver: name,
      records,
      hasError: false,
    };
  });

  await Promise.all(checks);

  return propagation;
}

/**
 * Perform comprehensive DNS query with propagation checks
 * @param domain - Domain name to query
 * @returns Complete DNS results including propagation data
 */
export async function queryDNSWithPropagation(domain: string): Promise<AllDNSResults> {
  // First, get all record types from primary resolver
  const results = await queryAllRecords(domain);

  // Then check propagation for each record type that has records
  const propagationChecks = Object.entries(results).map(async ([recordType, queryResult]) => {
    // Only check propagation if we have records from primary resolver
    if (queryResult.primaryRecords.length > 0) {
      const propagation = await checkPropagation(domain, recordType);
      queryResult.propagation = propagation;
    }
  });

  await Promise.all(propagationChecks);

  return results;
}

