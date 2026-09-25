import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSchema, ClassGroup, DailyReport, AppSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA: DatabaseSchema = {
  classes: [
    {
      id: 'turma-alpha-2026',
      name: 'Turma Alpha - Operações & Sistemas 2026',
      code: 'OPS-2026.1',
      instructor: 'Thiago Instrutor',
      status: 'EM_TREINAMENTO',
      startDate: '2026-03-01',
      endDate: '2026-04-15',
      description: 'Capacitação prática em ferramentas corporativas, sistemas de atendimento e fluxos operacionais.',
      students: [
        { id: 'std-1', name: 'Ana Beatriz Souza', email: 'ana.souza@empresa.com', enrollmentNumber: 'MAT-0101', active: true },
        { id: 'std-2', name: 'Carlos Eduardo Lima', email: 'carlos.lima@empresa.com', enrollmentNumber: 'MAT-0102', active: true },
        { id: 'std-3', name: 'Fernanda Rocha', email: 'fernanda.rocha@empresa.com', enrollmentNumber: 'MAT-0103', active: true },
        { id: 'std-4', name: 'Gabriel Mendes', email: 'gabriel.mendes@empresa.com', enrollmentNumber: 'MAT-0104', active: true },
        { id: 'std-5', name: 'Juliana Paes', email: 'juliana.paes@empresa.com', enrollmentNumber: 'MAT-0105', active: true },
        { id: 'std-6', name: 'Lucas Vinicius Santos', email: 'lucas.santos@empresa.com', enrollmentNumber: 'MAT-0106', active: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'turma-beta-concluida',
      name: 'Turma Piloto - Onboarding Técnico (Concluída)',
      code: 'ONB-2025.4',
      instructor: 'Thiago Instrutor',
      status: 'CONCLUIDA',
      startDate: '2025-11-01',
      endDate: '2025-12-15',
      description: 'Turma anterior finalizada com êxito. Arquivada para histórico.',
      students: [
        { id: 'std-b1', name: 'Mariana Duarte', email: 'mariana.duarte@empresa.com', enrollmentNumber: 'MAT-0080', active: true },
        { id: 'std-b2', name: 'Rafael Guimarães', email: 'rafael.g@empresa.com', enrollmentNumber: 'MAT-0081', active: true },
      ],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  reports: [
    {
      id: 'rep-sample-01',
      classId: 'turma-alpha-2026',
      className: 'Turma Alpha - Operações & Sistemas 2026',
      instructorName: 'Thiago Instrutor',
      date: new Date().toISOString().split('T')[0],
      systemsStatus: {
        operational: true,
        notes: 'Todos os computadores e acessos de VPN e CRM funcionaram perfeitamente durante todo o período.',
        affectedSystems: []
      },
      topicsStudied: 'Navegação e abertura de chamados no CRM, validação cadastral e boas práticas de segurança da informação.',
      practicalExercises: 'Simulação de 5 atendimentos padrão e preenchimento de formulários de contingência.',
      attendance: [
        { studentId: 'std-1', studentName: 'Ana Beatriz Souza', status: 'PRESENTE' },
        { studentId: 'std-2', studentName: 'Carlos Eduardo Lima', status: 'PRESENTE' },
        { studentId: 'std-3', studentName: 'Fernanda Rocha', status: 'AUSENTE', absenceReason: 'Consulta médica agendada (apresentará atestado)' },
        { studentId: 'std-4', studentName: 'Gabriel Mendes', status: 'PRESENTE' },
        { studentId: 'std-5', studentName: 'Juliana Paes', status: 'PRESENTE' },
        { studentId: 'std-6', studentName: 'Lucas Vinicius Santos', status: 'PRESENTE' },
      ],
      studentPerformances: [
        { studentId: 'std-1', studentName: 'Ana Beatriz Souza', level: 'EXCELENTE', score: 9.5, notes: 'Demonstrou rapidez e domínio total nos fluxos.' },
        { studentId: 'std-2', studentName: 'Carlos Eduardo Lima', level: 'BOM', score: 8.0, notes: 'Boa participação e atenção aos detalhes.' },
        { studentId: 'std-3', studentName: 'Fernanda Rocha', level: 'REGULAR', score: 7.0, notes: 'Ausente hoje, notas com base em exercícios anteriores.' },
        { studentId: 'std-4', studentName: 'Gabriel Mendes', level: 'ABAIXO_DO_ESPERADO', score: 5.0, lowPerformanceReason: 'Dificuldade para memorizar o fluxo de chamados críticos e cometeu erros recorrentes no preenchimento de campos obrigatórios. Necessita reforço individual no início da próxima aula.', notes: 'Requer atenção imediata' },
        { studentId: 'std-5', studentName: 'Juliana Paes', level: 'EXCELENTE', score: 9.0, notes: 'Ajudou os colegas e concluiu todos os exercícios.' },
        { studentId: 'std-6', studentName: 'Lucas Vinicius Santos', level: 'BOM', score: 8.5, notes: 'Evolução constante no ritmo de trabalho.' },
      ],
      generalObservations: 'Turma engajada. O aluno Gabriel precisará de 20 minutos de mentoria individual amanhã cedo.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  settings: {
    instructorDefaultName: 'Thiago Instrutor',
    companyName: 'Treinamento & Capacitação Corporativa',
    defaultRecipients: 'gestao.treinamento@empresa.com, coordenacao@empresa.com',
    emailFooterNote: 'Reporte gerado automaticamente pelo Sistema Integrado de Treinamento com Suporte de Inteligência Artificial.'
  }
};

function ensureDbExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

export function readDb(): DatabaseSchema {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error('Erro ao ler banco de dados JSON:', error);
    return INITIAL_DATA;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDbExists();
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

// Métodos auxiliares para Turmas
export function getClasses(onlyActive: boolean = false): ClassGroup[] {
  const db = readDb();
  if (onlyActive) {
    return db.classes.filter(c => c.status === 'EM_TREINAMENTO');
  }
  return db.classes;
}

export function getClassById(id: string): ClassGroup | undefined {
  const db = readDb();
  return db.classes.find(c => c.id === id);
}

export function saveClass(classData: Omit<ClassGroup, 'createdAt' | 'updatedAt'> & { id?: string }): ClassGroup {
  const db = readDb();
  const now = new Date().toISOString();

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
      writeDb(db);
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
  writeDb(db);
  return newClass;
}

export function deleteClass(id: string): boolean {
  const db = readDb();
  const initialLength = db.classes.length;
  db.classes = db.classes.filter(c => c.id !== id);
  if (db.classes.length !== initialLength) {
    // Também remove ou preserva os reportes
    writeDb(db);
    return true;
  }
  return false;
}

// Métodos auxiliares para Reportes
export function getReports(classId?: string): DailyReport[] {
  const db = readDb();
  if (classId) {
    return db.reports.filter(r => r.classId === classId).sort((a, b) => b.date.localeCompare(a.date));
  }
  return db.reports.sort((a, b) => b.date.localeCompare(a.date));
}

export function getReportById(id: string): DailyReport | undefined {
  const db = readDb();
  return db.reports.find(r => r.id === id);
}

export function saveReport(reportData: Omit<DailyReport, 'createdAt' | 'updatedAt'> & { id?: string }): DailyReport {
  const db = readDb();
  const now = new Date().toISOString();

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
      writeDb(db);
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
  writeDb(db);
  return newReport;
}

export function deleteReport(id: string): boolean {
  const db = readDb();
  const initialLength = db.reports.length;
  db.reports = db.reports.filter(r => r.id !== id);
  if (db.reports.length !== initialLength) {
    writeDb(db);
    return true;
  }
  return false;
}

// Métodos auxiliares para Configurações
export function getSettings(): AppSettings {
  const db = readDb();
  return db.settings || {};
}

export function updateSettings(settings: Partial<AppSettings>): AppSettings {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...settings,
  };
  writeDb(db);
  return db.settings;
}
