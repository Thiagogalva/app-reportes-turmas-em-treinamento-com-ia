export type ClassStatus = "EM_TREINAMENTO" | "CONCLUIDA";

export type AttendanceStatus = "PRESENTE" | "AUSENTE" | "ATRASADO" | "JUSTIFICADO";

export type PerformanceLevel = "EXCELENTE" | "BOM" | "REGULAR" | "ABAIXO_DO_ESPERADO";

export interface Student {
  id: string;
  name: string;
  email?: string;
  enrollmentNumber?: string;
  active: boolean;
}

export interface ClassGroup {
  id: string;
  name: string;
  code: string;
  instructor: string;
  status: ClassStatus;
  startDate: string;
  endDate?: string;
  description?: string;
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatusReport {
  operational: boolean;
  notes: string;
  affectedSystems?: string[];
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  absenceReason?: string;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
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
  classes: ClassGroup[];
  reports: DailyReport[];
  settings: AppSettings;
}
