import { AllDNSResults, DiagnosticIssue, DiagnosticResult, DNSRecord } from './types';
import { TTL_THRESHOLDS, DNS_RECORD_TYPES } from './constants';

/**
 * Validate SPF record syntax
 * @param spfRecord - SPF record string
 * @returns true if valid, false otherwise
 */
function validateSPF(spfRecord: string): boolean {
  // Basic SPF validation
  if (!spfRecord.startsWith('v=spf1')) {
    return false;
  }

  // Check for common SPF syntax issues
  const validMechanisms = /^[+\-~?]?(all|include|a|mx|ptr|ip4|ip6|exists|redirect|exp)/i;
  const parts = spfRecord.split(' ').slice(1); // Skip 'v=spf1'

  for (const part of parts) {
    if (part === '') continue;
    if (part === 'all') continue; // 'all' is always valid
    if (!validMechanisms.test(part)) {
      return false;
    }
  }

  return true;
}

/**
 * Check for NS record mismatches across resolvers
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if NS mismatch found
 */
function checkNSMismatch(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const nsResults = dnsResults.NS;

  if (!nsResults || nsResults.primaryRecords.length === 0) {
    return issues;
  }

  // Get NS records from primary resolver
  const primaryNS = new Set(
    nsResults.primaryRecords.map((r) => r.data.toLowerCase())
  );

  // Check if other resolvers return different NS records
  const resolverNS: { [resolver: string]: Set<string> } = {};
  let hasMismatch = false;

  for (const [resolver, result] of Object.entries(nsResults.propagation)) {
    if (result.hasError) continue;

    const nsSet = new Set(result.records.map((r) => r.data.toLowerCase()));
    resolverNS[resolver] = nsSet;

    // Check if sets differ
    if (nsSet.size !== primaryNS.size || ![...nsSet].every((ns) => primaryNS.has(ns))) {
      hasMismatch = true;
    }
  }

  if (hasMismatch) {
    issues.push({
      type: 'ns_mismatch',
      severity: 'error',
      message: 'NS records differ across DNS resolvers',
      details: {
        primary: [...primaryNS],
        resolvers: Object.fromEntries(
          Object.entries(resolverNS).map(([k, v]) => [k, [...v]])
        ),
      },
    });
  }

  return issues;
}

/**
 * Check for CNAME at apex (root domain) - RFC violation
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if CNAME at apex found
 */
function checkCNAMEAtApex(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const cnameResults = dnsResults.CNAME;
  const aResults = dnsResults.A;
  const aaaaResults = dnsResults.AAAA;

  if (!cnameResults || cnameResults.primaryRecords.length === 0) {
    return issues;
  }

  // Check if CNAME exists at apex (name matches domain exactly or is @)
  const cnameAtApex = cnameResults.primaryRecords.some((record) => {
    const name = record.name.toLowerCase();
    // Apex CNAME would have name matching the domain or being '@'
    return name.endsWith('.') || name === '@';
  });

  if (cnameAtApex && (aResults?.primaryRecords.length > 0 || aaaaResults?.primaryRecords.length > 0)) {
    issues.push({
      type: 'cname_at_apex',
      severity: 'error',
      message: 'CNAME record found at apex (root domain) - RFC violation',
      details: {
        cnameRecords: cnameResults.primaryRecords,
      },
    });
  }

  return issues;
}

/**
 * Check for missing AAAA records (IPv6 readiness)
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if AAAA missing
 */
function checkMissingAAAA(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const aResults = dnsResults.A;
  const aaaaResults = dnsResults.AAAA;

  // If domain has A records but no AAAA records, it's a warning
  if (aResults && aResults.primaryRecords.length > 0) {
    if (!aaaaResults || aaaaResults.primaryRecords.length === 0) {
      issues.push({
        type: 'missing_aaaa',
        severity: 'warning',
        message: 'Domain has A records but no AAAA records - not IPv6 ready',
        details: {
          aRecords: aResults.primaryRecords.length,
          aaaaRecords: 0,
        },
      });
    }
  }

  return issues;
}

/**
 * Check for missing MX or TXT records for email setup
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if email records missing
 */
function checkEmailSetup(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const mxResults = dnsResults.MX;
  const txtResults = dnsResults.TXT;

  const hasMX = mxResults && mxResults.primaryRecords.length > 0;
  const hasTXT = txtResults && txtResults.primaryRecords.length > 0;

  // Check for SPF, DKIM, DMARC in TXT records
  const hasSPF = txtResults?.primaryRecords.some((r) =>
    r.data.toLowerCase().startsWith('v=spf1')
  );
  const hasDMARC = txtResults?.primaryRecords.some((r) =>
    r.data.toLowerCase().startsWith('v=dmarc1')
  );

  if (!hasMX && !hasTXT) {
    issues.push({
      type: 'missing_email_setup',
      severity: 'info',
      message: 'No MX or TXT records found - domain may not be configured for email',
    });
  } else {
    if (hasMX && !hasSPF) {
      issues.push({
        type: 'missing_spf',
        severity: 'warning',
        message: 'MX records present but no SPF record found',
      });
    }
    if (hasMX && !hasDMARC) {
      issues.push({
        type: 'missing_dmarc',
        severity: 'info',
        message: 'MX records present but no DMARC record found',
      });
    }
  }

  return issues;
}

/**
 * Validate SPF syntax in TXT records
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if SPF syntax problems found
 */
function checkSPFSyntax(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  const txtResults = dnsResults.TXT;

  if (!txtResults || txtResults.primaryRecords.length === 0) {
    return issues;
  }

  // Find SPF records
  const spfRecords = txtResults.primaryRecords.filter((r) =>
    r.data.toLowerCase().startsWith('v=spf1')
  );

  for (const record of spfRecords) {
    if (!validateSPF(record.data)) {
      issues.push({
        type: 'spf_syntax_error',
        severity: 'error',
        message: 'SPF record has syntax errors',
        details: {
          record: record.data,
        },
      });
    }
  }

  return issues;
}

/**
 * Check TTL values (flag if too high or too low)
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues if TTL problems found
 */
function checkTTL(dnsResults: AllDNSResults): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  for (const [recordType, queryResult] of Object.entries(dnsResults)) {
    for (const record of queryResult.primaryRecords) {
      const ttl = record.TTL;

      if (ttl < TTL_THRESHOLDS.MIN_RECOMMENDED) {
        issues.push({
          type: 'ttl_too_low',
          severity: 'warning',
          message: `TTL too low (${ttl}s) for ${recordType} record - may cause excessive DNS queries`,
          details: {
            recordType,
            ttl,
            recommended: `>= ${TTL_THRESHOLDS.MIN_RECOMMENDED}s`,
          },
        });
      } else if (ttl > TTL_THRESHOLDS.MAX_RECOMMENDED) {
        issues.push({
          type: 'ttl_too_high',
          severity: 'info',
          message: `TTL very high (${ttl}s) for ${recordType} record - changes will take longer to propagate`,
          details: {
            recordType,
            ttl,
            recommended: `<= ${TTL_THRESHOLDS.MAX_RECOMMENDED}s`,
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Check DNSSEC status
 * @param dnsResults - DNS query results
 * @returns Diagnostic issues related to DNSSEC
 */
async function checkDNSSEC(dnsResults: AllDNSResults, domain: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = [];

  // Query for RRSIG records to check DNSSEC
  // Note: This would require an additional DNS query, but for now we'll check if we can infer
  // DNSSEC status from the presence of RRSIG records in responses
  
  // Most DoH resolvers don't return RRSIG in standard queries
  // This is a simplified check - in production, you'd want to query RRSIG explicitly
  issues.push({
    type: 'dnssec_check',
    severity: 'info',
    message: 'DNSSEC status check requires explicit RRSIG query - not fully implemented',
    details: {
      note: 'DNSSEC validation typically requires specialized queries',
    },
  });

  return issues;
}

/**
 * Perform comprehensive DNS diagnostics
 * @param dnsResults - DNS query results
 * @param domain - Domain name being analyzed
 * @returns Diagnostic result with all issues found
 */
export async function analyzeDNS(
  dnsResults: AllDNSResults,
  domain: string
): Promise<DiagnosticResult> {
  const issues: DiagnosticIssue[] = [];

  // Run all diagnostic checks
  issues.push(...checkNSMismatch(dnsResults));
  issues.push(...checkCNAMEAtApex(dnsResults));
  issues.push(...checkMissingAAAA(dnsResults));
  issues.push(...checkEmailSetup(dnsResults));
  issues.push(...checkSPFSyntax(dnsResults));
  issues.push(...checkTTL(dnsResults));
  issues.push(...(await checkDNSSEC(dnsResults, domain)));

  // Count issues by severity
  const summary = {
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return {
    issues,
    summary,
  };
}

