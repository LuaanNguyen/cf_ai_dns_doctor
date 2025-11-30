// Type definitions for DNS Doctor

export interface DNSRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DNSResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: DNSRecord[];
  Authority?: DNSRecord[];
  Additional?: DNSRecord[];
}

export interface ResolverResult {
  resolver: string;
  records: DNSRecord[];
  hasError: boolean;
  error?: string;
}

export interface DNSQueryResult {
  recordType: string;
  primaryRecords: DNSRecord[];
  propagation: {
    [resolver: string]: ResolverResult;
  };
}

export interface AllDNSResults {
  [recordType: string]: DNSQueryResult;
}

export interface DiagnosticIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export interface DiagnosticResult {
  issues: DiagnosticIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface AIExplanation {
  summary: string;
  issues: Array<{
    issue: string;
    severity: number; // 1-10
    explanation: string;
    steps: string[];
  }>;
}

export interface DomainHistoryEntry {
  domain: string;
  rawDiagnostics: any;
  aiExplanation: AIExplanation;
  timestamp: number;
}

export interface APIResponse {
  domain: string;
  dnsResults: AllDNSResults;
  diagnostics: DiagnosticResult;
  aiExplanation: AIExplanation;
  timestamp: number;
}

