export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "PARTIALLY_COMPLIANT" | "UNDER_REVIEW";
export type ViolationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type InspectionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Mine {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  type: string;
  risk_level: RiskLevel;
  compliance_score: number;
}

export interface ComplianceRecord {
  id: string;
  mine_id: string;
  mine_name: string;
  status: ComplianceStatus;
  score: number;
  last_inspection: string;
  violations_count: number;
  risk_level: RiskLevel;
}

export interface Violation {
  id: string;
  mine_id: string;
  inspection_id: string | null;
  category: string;
  severity: string;
  description: string;
  regulation_ref: string | null;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  mine_id: string;
  inspector_id: string;
  inspection_type: string;
  scheduled_at: string;
  completed_at: string | null;
  status: string;
  findings: string | null;
  recommendations: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_mines: number;
  compliant_mines: number;
  active_violations: number;
  pending_inspections: number;
  avg_compliance_score: number;
  critical_alerts: number;
}
