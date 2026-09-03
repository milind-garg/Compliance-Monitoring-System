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
  mine_name: string;
  title: string;
  description: string;
  status: ViolationStatus;
  severity: RiskLevel;
  created_at: string;
  due_date: string;
  assigned_to?: string;
}

export interface Inspection {
  id: string;
  mine_id: string;
  mine_name: string;
  inspector_id: string;
  inspector_name: string;
  status: InspectionStatus;
  scheduled_date: string;
  completed_date?: string;
  score?: number;
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
