export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "PARTIALLY_COMPLIANT" | "UNDER_REVIEW";
export type ViolationStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type InspectionStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Mine {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  mine_type: string;
  is_active: boolean;
}

export interface ComplianceRecord {
  id: string;
  mine_id: string;
  period_start: string;
  period_end: string;
  overall_score: number;
  safety_score: number;
  environmental_score: number;
  labour_score: number;
  status: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  evidence_files: string[] | null;
  created_at: string;
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
  size: number;
  pages: number;
}

export interface DashboardStats {
  total_mines: number;
  compliant_mines: number;
  active_violations: number;
  pending_inspections: number;
  avg_compliance_score: number;
  critical_alerts: number;
}
