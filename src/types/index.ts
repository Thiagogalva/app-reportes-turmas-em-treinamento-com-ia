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
  slaDays?: number;         // Quantos dias leva para os acessos (login/rede/cliente) serem liberados
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDay {
  id: string;
  dayNumber: number;        // Dia 1, Dia 2, Dia 3...
  title: string;            // Ex: "Apresentações", "Sistema GEO - Teórico"
  plannedDate: string;      // YYYY-MM-DD — data em que deveria ser concluído
  completed: boolean;
  completedDate?: string;   // YYYY-MM-DD — data em que foi de fato marcado como concluído
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
  schedule?: ScheduleDay[];   // Cronograma dia-a-dia planejado para a turma
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

export interface SystemEvidence {
  id: string;
  systemId: string;
  systemName: string;
  imageDataUrl: string;   // imagem comprimida em base64 (data URI)
  uploadedAt: string;
  uploadedBy?: string;
  expiresAt: string;      // uploadedAt + 5 dias — depois disso é removida automaticamente
}

export interface SystemStatusReport {
  operational: boolean;
  notes: string;
  affectedSystems?: string[];
  operatorChecks?: OperatorSystemTestResult[];
  systemsAlreadyValidated?: boolean; // Se aproveitou a validação prévia sem necessidade de retestar
  evidences?: SystemEvidence[];
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
  viewerPasswordHash?: string; // senha simples e compartilhada, só para o /viewer
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'instrutor';
  createdAt: string;
}

export interface DatabaseSchema {
  segments: Segment[];
  classes: ClassGroup[];
  reports: DailyReport[];
  settings: AppSettings;
  users: AuthUser[];
}
