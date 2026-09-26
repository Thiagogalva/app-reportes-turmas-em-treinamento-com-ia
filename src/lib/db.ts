import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { DatabaseSchema, Segment, ClassGroup, DailyReport, AppSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Se DATABASE_URL (ou POSTGRES_URL) estiver definida, usamos Postgres (Neon) como
// armazenamento persistente. Caso contrário, caímos para o arquivo local
// data/db.json — útil para rodar em desenvolvimento sem precisar configurar banco.
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = CONNECTION_STRING ? neon(CONNECTION_STRING) : null;

let schemaReadyPromise: Promise<void> | null = null;

async function ensurePostgresSchema(): Promise<void> {
  if (!sql) return;
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS app_data (
          id SMALLINT PRIMARY KEY DEFAULT 1,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        INSERT INTO app_data (id, data)
        VALUES (1, ${JSON.stringify(INITIAL_DATA)}::jsonb)
        ON CONFLICT (id) DO NOTHING
      `;
    })();
  }
  return schemaReadyPromise;
}

const INITIAL_SEGMENTS: Segment[] = [
  {
    id: 'seg-varejo',
    name: 'Varejo',
    description: 'Segmento geral de atendimento a correntistas e pessoas físicas da rede de agências e canais remotos.',
    systems: [
      { id: 'sys-geo', name: 'Sistema GEO', description: 'Gestão Estratégica Operacional Bradesco', mandatory: true },
      { id: 'sys-wde', name: 'WDE (Workspace Desktop Edition)', description: 'Telefonia Genesys e softphone de atendimento', mandatory: true },
      { id: 'sys-crm', name: 'CRM Bradesco', description: 'Abertura de chamados e histórico do cliente', mandatory: true },
      { id: 'sys-portal', name: 'Portal Corporativo', description: 'Consultas cadastrais e normativas', mandatory: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-prime',
    name: 'Prime',
    description: 'Segmento de alta renda com ferramentas de assessoria financeira e consultoria especializada.',
    systems: [
      { id: 'sys-geo', name: 'Sistema GEO', description: 'Gestão Estratégica Operacional', mandatory: true },
      { id: 'sys-wde-prime', name: 'WDE Prime', description: 'Fila prioritária e discador telefônico', mandatory: true },
      { id: 'sys-invest', name: 'Plataforma de Investimentos', description: 'Assessoria de carteiras e produtos de mercado', mandatory: true },
      { id: 'sys-crm-prime', name: 'CRM Consultoria Prime', description: 'Registro de reuniões e planejamento financeiro', mandatory: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seg-cartoes',
    name: 'Cartões & Meios de Pagamento',
    description: 'Central especializada em emissão, bloqueio, transações e limite de cartões de crédito e débito.',
    systems: [
      { id: 'sys-geo', name: 'Sistema GEO', description: 'Gestão Estratégica Operacional', mandatory: true },
      { id: 'sys-wde', name: 'WDE (Workspace Desktop Edition)', description: 'Telefonia integrada', mandatory: true },
      { id: 'sys-vision', name: 'Vision Plus / Autorizador', description: 'Consulta e liberação de transações de cartões', mandatory: true },
      { id: 'sys-antifraude', name: 'Validador Antifraude', description: 'Análise de compras suspeitas e bloqueio cautelar', mandatory: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_DATA: DatabaseSchema = {
  segments: INITIAL_SEGMENTS,
  classes: [
    {
      id: 'turma-alpha-2026',
      name: 'Turma Alpha - Varejo Operações 2026',
      code: 'OPS-2026.1',
      instructor: 'Thiago Instrutor',
      segmentId: 'seg-varejo',
      segmentName: 'Varejo',
      status: 'EM_TREINAMENTO',
      startDate: '2026-03-01',
      endDate: '2026-04-15',
      description: 'Capacitação prática em ferramentas corporativas (GEO, WDE, CRM) e atendimento Bradesco Varejo.',
      systemsValidated: true,
      systemsValidationDate: '2026-03-01',
      students: [
        { id: 'std-1', name: 'Ana Beatriz Souza', email: 'ana.souza@bradesco.com.br', enrollmentNumber: 'MAT-9011', networkLogin: 'B812341', clientLogin: 'CLI-VAR-101', active: true },
        { id: 'std-2', name: 'Carlos Eduardo Lima', email: 'carlos.lima@bradesco.com.br', enrollmentNumber: 'MAT-9012', networkLogin: 'B812342', clientLogin: 'CLI-VAR-102', active: true },
        { id: 'std-3', name: 'Fernanda Rocha', email: 'fernanda.rocha@bradesco.com.br', enrollmentNumber: 'MAT-9013', networkLogin: 'B812343', clientLogin: 'CLI-VAR-103', active: true },
        { id: 'std-4', name: 'Gabriel Mendes', email: 'gabriel.mendes@bradesco.com.br', enrollmentNumber: 'MAT-9014', networkLogin: 'B812344', clientLogin: 'CLI-VAR-104', active: true },
        { id: 'std-5', name: 'Juliana Paes', email: 'juliana.paes@bradesco.com.br', enrollmentNumber: 'MAT-9015', networkLogin: 'B812345', clientLogin: 'CLI-VAR-105', active: true },
        { id: 'std-6', name: 'Lucas Vinicius Santos', email: 'lucas.santos@bradesco.com.br', enrollmentNumber: 'MAT-9016', networkLogin: 'B812346', clientLogin: 'CLI-VAR-106', active: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'turma-beta-concluida',
      name: 'Turma Piloto - Prime Onboarding (Concluída)',
      code: 'PRIME-2025.4',
      instructor: 'Thiago Instrutor',
      segmentId: 'seg-prime',
      segmentName: 'Prime',
      status: 'CONCLUIDA',
      startDate: '2025-11-01',
      endDate: '2025-12-15',
      description: 'Turma anterior finalizada com êxito. Arquivada para histórico.',
      systemsValidated: true,
      systemsValidationDate: '2025-11-02',
      students: [
        { id: 'std-b1', name: 'Mariana Duarte', email: 'mariana.duarte@bradesco.com.br', enrollmentNumber: 'MAT-8041', networkLogin: 'B701201', clientLogin: 'CLI-PRI-01', active: true },
        { id: 'std-b2', name: 'Rafael Guimarães', email: 'rafael.g@bradesco.com.br', enrollmentNumber: 'MAT-8042', networkLogin: 'B701202', clientLogin: 'CLI-PRI-02', active: true },
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  reports: [
    {
      id: 'rep-sample-01',
      classId: 'turma-alpha-2026',
      className: 'Turma Alpha - Varejo Operações 2026',
      segmentName: 'Varejo',
      instructorName: 'Thiago Instrutor',
      date: new Date().toISOString().split('T')[0],
      systemsStatus: {
        operational: true,
        notes: 'Sistemas GEO, WDE e CRM testados e 100% operacionais para todos os operadores.',
        affectedSystems: [],
        systemsAlreadyValidated: true
      },
      topicsStudied: 'Navegação e abertura de chamados no CRM, atendimento simulado via WDE e validação no Sistema GEO.',
      practicalExercises: 'Simulação de 5 atendimentos padrão de conta corrente e desbloqueio.',
      attendance: [
        { studentId: 'std-1', studentName: 'Ana Beatriz Souza', enrollmentNumber: 'MAT-9011', networkLogin: 'B812341', clientLogin: 'CLI-VAR-101', status: 'PRESENTE' },
        { studentId: 'std-2', studentName: 'Carlos Eduardo Lima', enrollmentNumber: 'MAT-9012', networkLogin: 'B812342', clientLogin: 'CLI-VAR-102', status: 'PRESENTE' },
        { studentId: 'std-3', studentName: 'Fernanda Rocha', enrollmentNumber: 'MAT-9013', networkLogin: 'B812343', clientLogin: 'CLI-VAR-103', status: 'AUSENTE', absenceReason: 'Consulta médica agendada' },
        { studentId: 'std-4', studentName: 'Gabriel Mendes', enrollmentNumber: 'MAT-9014', networkLogin: 'B812344', clientLogin: 'CLI-VAR-104', status: 'PRESENTE' },
        { studentId: 'std-5', studentName: 'Juliana Paes', enrollmentNumber: 'MAT-9015', networkLogin: 'B812345', clientLogin: 'CLI-VAR-105', status: 'PRESENTE' },
        { studentId: 'std-6', studentName: 'Lucas Vinicius Santos', enrollmentNumber: 'MAT-9016', networkLogin: 'B812346', clientLogin: 'CLI-VAR-106', status: 'PRESENTE' },
      ],
      studentPerformances: [
        { studentId: 'std-1', studentName: 'Ana Beatriz Souza', enrollmentNumber: 'MAT-9011', networkLogin: 'B812341', level: 'EXCELENTE', score: 9.5, notes: 'Demonstrou rapidez e domínio total nos fluxos.' },
        { studentId: 'std-2', studentName: 'Carlos Eduardo Lima', enrollmentNumber: 'MAT-9012', networkLogin: 'B812342', level: 'BOM', score: 8.0, notes: 'Boa participação e atenção aos detalhes.' },
        { studentId: 'std-3', studentName: 'Fernanda Rocha', enrollmentNumber: 'MAT-9013', networkLogin: 'B812343', level: 'REGULAR', score: 7.0, notes: 'Ausente hoje.' },
        { studentId: 'std-4', studentName: 'Gabriel Mendes', enrollmentNumber: 'MAT-9014', networkLogin: 'B812344', level: 'ABAIXO_DO_ESPERADO', score: 5.0, lowPerformanceReason: 'Dificuldade para memorizar o fluxo de chamados no CRM e erros no registro do Sistema GEO. Necessita reforço individual.', notes: 'Requer atenção imediata' },
        { studentId: 'std-5', studentName: 'Juliana Paes', enrollmentNumber: 'MAT-9015', networkLogin: 'B812345', level: 'EXCELENTE', score: 9.0, notes: 'Excelente fixação no WDE.' },
        { studentId: 'std-6', studentName: 'Lucas Vinicius Santos', enrollmentNumber: 'MAT-9016', networkLogin: 'B812346', level: 'BOM', score: 8.5, notes: 'Evolução constante no ritmo de trabalho.' },
      ],
      generalObservations: 'Turma engajada com alto aproveitamento nos sistemas corporativos.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  settings: {
    instructorDefaultName: 'Thiago Instrutor',
    companyName: 'Bradesco - Treinamento & Capacitação',
    defaultRecipients: 'gestao.treinamento@bradesco.com.br, coordenacao@bradesco.com.br',
    emailFooterNote: 'Reporte gerado pelo Sistema TreinaReport AI - Padrão Bradesco.'
  },
  users: []
};

function ensureLocalFileDbExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  } else {
    // Garante que o campo segments existe no arquivo existente
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (!data.segments || data.segments.length === 0) {
        data.segments = INITIAL_SEGMENTS;
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (err) {
      console.warn("Erro ao verificar segmentos no db.json:", err);
    }
  }
}

export async function readDb(): Promise<DatabaseSchema> {
  if (sql) {
    await ensurePostgresSchema();
    try {
      const rows = await sql`SELECT data FROM app_data WHERE id = 1`;
      const parsed = (rows[0]?.data ?? INITIAL_DATA) as DatabaseSchema;
      if (!parsed.segments) parsed.segments = INITIAL_SEGMENTS;
      if (!parsed.users) parsed.users = [];
      return parsed;
    } catch (error) {
      console.error('Erro ao ler banco de dados Postgres:', error);
      return INITIAL_DATA;
    }
  }

  // Fallback: arquivo JSON local (desenvolvimento sem DATABASE_URL configurada)
  ensureLocalFileDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.segments) parsed.segments = INITIAL_SEGMENTS;
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch (error) {
    console.error('Erro ao ler banco de dados JSON:', error);
    return INITIAL_DATA;
  }
}

export async function writeDb(data: DatabaseSchema): Promise<void> {
  if (sql) {
    await ensurePostgresSchema();
    await sql`
      INSERT INTO app_data (id, data, updated_at)
      VALUES (1, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    return;
  }

  // Fallback: arquivo JSON local
  ensureLocalFileDbExists();
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

// ==================== SEGMENTOS ====================
export async function getSegments(): Promise<Segment[]> {
  const db = await readDb();
  return db.segments || INITIAL_SEGMENTS;
}

export async function getSegmentById(id: string): Promise<Segment | undefined> {
  const db = await readDb();
  return (db.segments || []).find(s => s.id === id);
}

export async function saveSegment(segmentData: Omit<Segment, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Segment> {
  const db = await readDb();
  const now = new Date().toISOString();

  if (segmentData.id) {
    const index = db.segments.findIndex(s => s.id === segmentData.id);
    if (index !== -1) {
      const updated: Segment = {
        ...db.segments[index],
        ...segmentData,
        id: segmentData.id,
        updatedAt: now,
      };
      db.segments[index] = updated;
      await writeDb(db);
      return updated;
    }
  }

  const newSegment: Segment = {
    ...segmentData,
    id: segmentData.id || `seg-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  db.segments.push(newSegment);
  await writeDb(db);
  return newSegment;
}

export async function deleteSegment(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.segments.length;
  db.segments = db.segments.filter(s => s.id !== id);
  if (db.segments.length !== initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// ==================== TURMAS ====================
export async function getClasses(onlyActive: boolean = false): Promise<ClassGroup[]> {
  const db = await readDb();
  if (onlyActive) {
    return db.classes.filter(c => c.status === 'EM_TREINAMENTO');
  }
  return db.classes;
}

export async function getClassById(id: string): Promise<ClassGroup | undefined> {
  const db = await readDb();
  return db.classes.find(c => c.id === id);
}

export async function saveClass(classData: Omit<ClassGroup, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ClassGroup> {
  const db = await readDb();
  const now = new Date().toISOString();

  // Se o segmento foi informado, sincroniza o nome do segmento
  if (classData.segmentId && !classData.segmentName) {
    const seg = (db.segments || []).find(s => s.id === classData.segmentId);
    if (seg) classData.segmentName = seg.name;
  }

  if (classData.id) {
    const index = db.classes.findIndex(c => c.id === classData.id);
    if (index !== -1) {
      const updated: ClassGroup = {
        ...db.classes[index],
        ...classData,
        id: classData.id,
        updatedAt: now,
      };
      db.classes[index] = updated;
      await writeDb(db);
      return updated;
    }
  }

  const newClass: ClassGroup = {
    ...classData,
    id: classData.id || `turma-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  db.classes.push(newClass);
  await writeDb(db);
  return newClass;
}

export async function deleteClass(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.classes.length;
  db.classes = db.classes.filter(c => c.id !== id);
  if (db.classes.length !== initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// ==================== REPORTES ====================
export async function getReports(classId?: string): Promise<DailyReport[]> {
  const db = await readDb();
  if (classId) {
    return db.reports.filter(r => r.classId === classId).sort((a, b) => b.date.localeCompare(a.date));
  }
  return db.reports.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getReportById(id: string): Promise<DailyReport | undefined> {
  const db = await readDb();
  return db.reports.find(r => r.id === id);
}

export async function saveReport(reportData: Omit<DailyReport, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DailyReport> {
  const db = await readDb();
  const now = new Date().toISOString();

  // Atualiza validação de sistemas na turma se todos os sistemas de todos os operadores estiverem OK
  if (reportData.systemsStatus?.operational) {
    const classIdx = db.classes.findIndex(c => c.id === reportData.classId);
    if (classIdx !== -1) {
      db.classes[classIdx].systemsValidated = true;
      db.classes[classIdx].systemsValidationDate = reportData.date;
    }
  }

  if (reportData.id) {
    const index = db.reports.findIndex(r => r.id === reportData.id);
    if (index !== -1) {
      const updated: DailyReport = {
        ...db.reports[index],
        ...reportData,
        id: reportData.id,
        updatedAt: now,
      };
      db.reports[index] = updated;
      await writeDb(db);
      return updated;
    }
  }

  const newReport: DailyReport = {
    ...reportData,
    id: reportData.id || `report-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  db.reports.push(newReport);
  await writeDb(db);
  return newReport;
}

export async function deleteReport(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.reports.length;
  db.reports = db.reports.filter(r => r.id !== id);
  if (db.reports.length !== initialLength) {
    await writeDb(db);
    return true;
  }
  return false;
}

// ==================== CONFIGURAÇÕES ====================
export async function getSettings(): Promise<AppSettings> {
  const db = await readDb();
  return db.settings || {};
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const db = await readDb();
  db.settings = {
    ...db.settings,
    ...settings,
  };
  await writeDb(db);
  return db.settings;
}
