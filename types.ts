export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum SentinelModule {
  ABOUT_PLATFORM = 'ABOUT_PLATFORM', // Moved to top as default/info
  AUDIT_ENGINE = 'AUDIT_ENGINE',
  ADVISORY_CHAT = 'ADVISORY_CHAT',
  SECURE_FORGE = 'SECURE_FORGE',
  CRISIS_SIMULATOR = 'CRISIS_SIMULATOR',
  COMPLIANCE_SHIELD = 'COMPLIANCE_SHIELD',
  LEAK_HUNTER = 'LEAK_HUNTER'
}

export type Language = 'es' | 'en';
export type PlanType = 'FREE' | 'OPERATIVE' | 'COMMAND';

export interface User {
  email: string;
  name?: string;
  plan: PlanType;
  usageCount: number;
}

export interface Vulnerability {
  id: string;
  name: string;
  severity: Severity;
  description: string;
  impact: string;
  remediationSteps: string; // Added field for step-by-step instructions
  remediationCode: string; // The patched code snippet
  lineNumbers?: string;
}

export interface AuditResult {
  securityScore: number; // 0 - 100
  executiveSummary: string;
  vulnerabilities: Vulnerability[];
  detailedReportMarkdown: string; // The full markdown text requested by the persona
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AnalysisResponse {
  result: AuditResult | string; // Can be structured audit or raw markdown for other modules
  type: 'audit' | 'text';
  groundingSources: GroundingSource[];
}