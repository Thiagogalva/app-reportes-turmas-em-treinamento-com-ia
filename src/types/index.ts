export type ClassStatus = "EM_TREINAMENTO" | "CONCLUIDA";

export type AttendanceStatus = "PRESENTE" | "AUSENTE" | "ATRASADO" | "JUSTIFICADO";

export type PerformanceLevel = "EXCELENTE" | "BOM" | "REGULAR" | "ABAIXO_DO_ESPERADO";

export interface Student {
  id: string;
  name: string;
  email?: string;
  enrollmentNumber: string; // Matrícula do operador
  networkLogin: string;     // Login de Rede (ex: B123456)
  clientLogin?: string;     // Login Cliente (ex: CLI-9081)
  active: boolean;
}

export interface SegmentSystem {
  id: string;
  name: string;             // ex: "Sistema GEO", "WDE (Workspace Desktop Edition)"
  description?: string;
  mandatory?: boolean;
}

export interface Segment {
  id: string;
  name: string;             // ex: "Varejo", "Prime", "Cartões", "Financiamento"
  description?: string;
  systems: SegmentSystem[];
  createdAt: string;
  updatedAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  code: string;
  instructor: string;
  segmentId?: string;       // ID do segmento vinculado
  segmentName?: string;     // Nome do segmento (ex: "Varejo")
  status: ClassStatus;
  startDate: string;
  endDate?: string;
  description?: string;
  students: Student[];
  systemsValidated?: boolean; // Se os sistemas de todos os operadores já foram testados e estão 100% OK
  systemsValidationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorSystemTestResult {
  studentId: string;
  studentName: string;
  networkLogin: string;
  clientLogin?: string;
  allSystemsOk: boolean;
  systemStatuses: {
    systemId: string;
    systemName: string;
    operational: boolean;
    notes?: string;
  }[];
}

export interface SystemStatusReport {
  operational: boolean;
  notes: string;
  affectedSystems?: string[];
  operatorChecks?: OperatorSystemTestResult[];
  systemsAlreadyValidated?: boolean; // Se aproveitou a validação prévia sem necessidade de retestar
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  networkLogin?: string;
  clientLogin?: string;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  enrollmentNumber?: string;
  networkLogin?: string;
  clientLogin?: string;
  level: PerformanceLevel;
  score?: number;
  lowPerformanceReason?: string; // Obrigatório se level === "ABAIXO_DO_ESPERADO"
  notes?: string;
}

export interface AiGeneratedReport {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  executiveSummary: string;
  actionPlan: string;
  generatedAt: string;
}

export interface DailyReport {
  id: string;
  classId: string;
  className: string;
  segmentName?: string;
  instructorName: string;
  date: string; // YYYY-MM-DD
  systemsStatus: SystemStatusReport;
  topicsStudied: string;
  practicalExercises?: string;
  attendance: StudentAttendance[];
  studentPerformances: StudentPerformance[];
  generalObservations?: string;
  aiGeneratedEmail?: AiGeneratedReport;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey?: string;
  defaultRecipients?: string;
  instructorDefaultName?: string;
  companyName?: string;
  emailFooterNote?: string;
}

export interface DatabaseSchema {
  segments: Segment[];
  classes: ClassGroup[];
  reports: DailyReport[];
  settings: AppSettings;
}
