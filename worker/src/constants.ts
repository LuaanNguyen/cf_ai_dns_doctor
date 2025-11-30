// Constants for DNS Doctor

// DNS record type numbers (RFC 1035)
export const DNS_RECORD_TYPES = {
  A: 1,
  AAAA: 28,
  CNAME: 5,
  MX: 15,
  NS: 2,
  TXT: 16,
  SOA: 6,
  CAA: 257,
  RRSIG: 46, // For DNSSEC detection
} as const;

// DNS-over-HTTPS resolver endpoints
export const RESOLVERS = {
  CLOUDFLARE: 'https://cloudflare-dns.com/dns-query',
  GOOGLE: 'https://dns.google/resolve',
  QUAD9: 'https://dns.quad9.net/dns-query',
  // OpenDNS doesn't have a public DoH endpoint, so we'll skip it
} as const;

// Record types to query
export const QUERY_RECORD_TYPES: Array<keyof typeof DNS_RECORD_TYPES> = [
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'NS',
  'TXT',
  'SOA',
  'CAA',
];

// TTL thresholds for diagnostics
export const TTL_THRESHOLDS = {
  MIN_RECOMMENDED: 300, // 5 minutes
  MAX_RECOMMENDED: 86400, // 24 hours
} as const;

// Domain validation regex (RFC 1035 compliant)
export const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

