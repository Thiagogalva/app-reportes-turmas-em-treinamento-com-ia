import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { DatabaseSchema, Segment, ClassGroup, DailyReport, AppSettings, MigrationSlaRule, Chamado, PushSubscriptionRecord } from '@/types';

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
  users: [],
  migrationRules: [
  { id: "mig-1", origin: "CAC Varejo", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-2", origin: "CAC Varejo", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-3", origin: "CAC Varejo", destination: "Casos Especiais BKO", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-4", origin: "CAC Varejo", destination: "BNDES", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-5", origin: "CAC Varejo", destination: "Fone Fácil PF", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-6", origin: "CAC Varejo", destination: "Joy", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-7", origin: "CAC Varejo", destination: "Prime", chamadoSlaDays: 16, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-8", origin: "CAC Varejo", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-9", origin: "CAC Varejo", destination: "PJ Corp", chamadoSlaDays: 16, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-10", origin: "CAC Varejo", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-11", origin: "CAC Varejo", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-12", origin: "CAC Varejo", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-13", origin: "CAC PJ", destination: "Alto Valor", chamadoSlaDays: 16, trainingSlaDays: 26, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-14", origin: "CAC PJ", destination: "Casos Especiais BKO", chamadoSlaDays: 21, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-15", origin: "CAC PJ", destination: "BNDES", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-16", origin: "CAC PJ", destination: "Fone Fácil PF", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-17", origin: "CAC PJ", destination: "Joy", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-18", origin: "CAC PJ", destination: "Prime", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-19", origin: "CAC PJ", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-20", origin: "CAC PJ", destination: "PJ Corp", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-21", origin: "CAC PJ", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-22", origin: "CAC PJ", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-23", origin: "CAC PJ", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-24", origin: "BNDES", destination: "Alto Valor", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-25", origin: "BNDES", destination: "Casos Especiais BKO", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-26", origin: "BNDES", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-27", origin: "BNDES", destination: "Fone Fácil PF", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-28", origin: "BNDES", destination: "Joy", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-29", origin: "BNDES", destination: "Prime", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-30", origin: "BNDES", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-31", origin: "BNDES", destination: "PJ Corp", chamadoSlaDays: 16, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-32", origin: "BNDES", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-33", origin: "BNDES", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-34", origin: "BNDES", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-35", origin: "Fone Fácil PF", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 27, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-36", origin: "Fone Fácil PF", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 27, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-37", origin: "Fone Fácil PF", destination: "Casos Especiais BKO", chamadoSlaDays: 21, trainingSlaDays: 30, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-38", origin: "Fone Fácil PF", destination: "BNDES", chamadoSlaDays: 21, trainingSlaDays: 27, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-39", origin: "Fone Fácil PF", destination: "Joy", chamadoSlaDays: 16, trainingSlaDays: 7, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-40", origin: "Fone Fácil PF", destination: "Prime", chamadoSlaDays: 16, trainingSlaDays: 3, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-41", origin: "Fone Fácil PF", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-42", origin: "Fone Fácil PF", destination: "PJ Corp", chamadoSlaDays: 16, trainingSlaDays: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-43", origin: "Fone Fácil PF", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-44", origin: "Fone Fácil PF", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-45", origin: "Fone Fácil PF", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-46", origin: "Fone Fácil PF", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-47", origin: "Fone Fácil PF", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 40, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-48", origin: "Joy", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 40, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-49", origin: "Prime", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 40, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-50", origin: "Chat", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 40, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-51", origin: "PJ Corp", destination: "Alto Valor", chamadoSlaDays: 21, trainingSlaDays: 40, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-52", origin: "Fone Fácil PF", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 16, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-53", origin: "Joy", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 16, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-54", origin: "Prime", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 16, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-55", origin: "Chat", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 16, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-56", origin: "PJ Corp", destination: "CAC Varejo", chamadoSlaDays: 21, trainingSlaDays: 16, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-57", origin: "Fone Fácil PF", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-58", origin: "Joy", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-59", origin: "Prime", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-60", origin: "Chat", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-61", origin: "PJ Corp", destination: "CAC PJ", chamadoSlaDays: 21, trainingSlaDays: 23, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-62", origin: "Prime", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-63", origin: "Joy", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 21, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-64", origin: "PJ Corp", destination: "Chat", chamadoSlaDays: 21, trainingSlaDays: 31, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-65", origin: "Alto Valor", destination: "PAF IN/OUT", chamadoSlaDays: 21, trainingSlaDays: 17, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-66", origin: "Alto Valor", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-67", origin: "Alto Valor", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-68", origin: "Alto Valor", destination: "PAF Out Bradescard", chamadoSlaDays: 21, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-69", origin: "PAF In", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-70", origin: "PAF In", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-71", origin: "PAF Out", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-72", origin: "PAF Out", destination: "PAF Out Bradescard", chamadoSlaDays: 10, trainingSlaDays: 10, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-73", origin: "PAF Out Bradescard", destination: "PAF In", chamadoSlaDays: 21, trainingSlaDays: 20, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "mig-74", origin: "PAF Out Bradescard", destination: "PAF Out", chamadoSlaDays: 21, trainingSlaDays: 15, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  ],
  chamados: [],
  pushSubscriptions: []
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

// Usuários criados ANTES do sistema de perfis (Admin/Instrutor) existir não têm o
// campo `role` salvo. Como só existia um tipo de conta até então, tratamos esses
// registros antigos como administradores — nunca como instrutor (mais restrito).
function migrateUserRoles(users: any[] | undefined): any[] {
  if (!users) return [];
  return users.map(u => (u.role ? u : { ...u, role: 'admin' }));
}

// Evidências de erro (prints anexados aos reportes) expiram após 5 dias, para
// não acumular imagens indefinidamente no banco de dados.
export function purgeExpiredEvidences(reports: any[] | undefined): { reports: any[]; changed: boolean } {
  if (!reports) return { reports: [], changed: false };
  const now = Date.now();
  let changed = false;
  const cleaned = reports.map(r => {
    const evidences = r?.systemsStatus?.evidences;
    if (!evidences || evidences.length === 0) return r;
    const kept = evidences.filter((ev: any) => !ev.expiresAt || new Date(ev.expiresAt).getTime() > now);
    if (kept.length === evidences.length) return r;
    changed = true;
    return { ...r, systemsStatus: { ...r.systemsStatus, evidences: kept } };
  });
  return { reports: cleaned, changed };
}

// Remove evidências de reportes cuja turma (classId) já não existe mais no
// sistema — cobre o caso de turmas que foram excluídas no passado, antes
// dessa limpeza existir, e cujas evidências ficaram "órfãs".
export function purgeOrphanedEvidences(reports: any[] | undefined, classIds: Set<string>): { reports: any[]; changed: boolean } {
  if (!reports) return { reports: [], changed: false };
  let changed = false;
  const cleaned = reports.map(r => {
    const evidences = r?.systemsStatus?.evidences;
    if (!evidences || evidences.length === 0) return r;
    if (classIds.has(r.classId)) return r; // turma ainda existe, mantém
    changed = true;
    return { ...r, systemsStatus: { ...r.systemsStatus, evidences: [] } };
  });
  return { reports: cleaned, changed };
}

/**
 * Remove (em memória, sem gravar sozinho) todas as evidências dos reportes
 * de uma turma específica — usado quando a turma é excluída ou encerrada.
 */
export function stripEvidencesForClass(reports: any[], classId: string): { reports: any[]; changed: boolean } {
  let changed = false;
  const cleaned = reports.map(r => {
    if (r.classId !== classId) return r;
    const evidences = r?.systemsStatus?.evidences;
    if (!evidences || evidences.length === 0) return r;
    changed = true;
    return { ...r, systemsStatus: { ...r.systemsStatus, evidences: [] } };
  });
  return { reports: cleaned, changed };
}

export async function readDb(): Promise<DatabaseSchema> {
  if (sql) {
    await ensurePostgresSchema();
    try {
      const rows = await sql`SELECT data FROM app_data WHERE id = 1`;
      const parsed = (rows[0]?.data ?? INITIAL_DATA) as DatabaseSchema;
      if (!parsed.segments) parsed.segments = INITIAL_SEGMENTS;
      parsed.users = migrateUserRoles(parsed.users);
      if (!parsed.migrationRules) parsed.migrationRules = [];
      if (!parsed.chamados) parsed.chamados = [];
      if (!parsed.pushSubscriptions) parsed.pushSubscriptions = [];
      const expiredResult = purgeExpiredEvidences(parsed.reports);
      const existingClassIds = new Set(parsed.classes.map(c => c.id));
      const orphanResult = purgeOrphanedEvidences(expiredResult.reports, existingClassIds);
      parsed.reports = orphanResult.reports;
      const changed = expiredResult.changed || orphanResult.changed;
      if (changed) {
        // Persiste a limpeza para realmente liberar espaço no banco.
        await writeDb(parsed);
      }
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
    parsed.users = migrateUserRoles(parsed.users);
    if (!parsed.migrationRules) parsed.migrationRules = [];
    if (!parsed.chamados) parsed.chamados = [];
    if (!parsed.pushSubscriptions) parsed.pushSubscriptions = [];
    const expiredResultLocal = purgeExpiredEvidences(parsed.reports);
    const existingClassIdsLocal = new Set(parsed.classes.map(c => c.id));
    const { reports, changed: orphanChangedLocal } = purgeOrphanedEvidences(expiredResultLocal.reports, existingClassIdsLocal);
    const changed = expiredResultLocal.changed || orphanChangedLocal;
    parsed.reports = reports;
    if (changed) {
      await writeDb(parsed);
    }
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
      const wasAlreadyConcluded = db.classes[index].status === 'CONCLUIDA';
      const updated: ClassGroup = {
        ...db.classes[index],
        ...classData,
        id: classData.id,
        updatedAt: now,
      };
      db.classes[index] = updated;

      // Turma foi encerrada agora (não estava concluída antes) → as evidências
      // de erro dessa turma deixam de ser necessárias e são removidas.
      if (updated.status === 'CONCLUIDA' && !wasAlreadyConcluded) {
        const { reports, changed } = stripEvidencesForClass(db.reports, updated.id);
        if (changed) db.reports = reports;
      }

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

/**
 * Marca (ou desmarca) um dia do cronograma de uma turma como concluído.
 * Ação operacional do dia a dia — diferente de editar dados da turma, por
 * isso não é restrita a administradores (qualquer instrutor logado pode usar
 * ao preencher o reporte diário).
 */
export async function toggleScheduleDay(classId: string, dayId: string, completed: boolean): Promise<ClassGroup | null> {
  const db = await readDb();
  const classIndex = db.classes.findIndex(c => c.id === classId);
  if (classIndex === -1) return null;

  const classGroup = db.classes[classIndex];
  const schedule = (classGroup.schedule || []).map(day =>
    day.id === dayId
      ? { ...day, completed, completedDate: completed ? new Date().toISOString().slice(0, 10) : undefined }
      : day
  );

  const updated: ClassGroup = { ...classGroup, schedule, updatedAt: new Date().toISOString() };
  db.classes[classIndex] = updated;
  await writeDb(db);
  return updated;
}

export async function deleteClass(id: string): Promise<boolean> {
  const db = await readDb();
  const initialLength = db.classes.length;
  db.classes = db.classes.filter(c => c.id !== id);
  if (db.classes.length !== initialLength) {
    // A turma deixou de existir — remove também as evidências de erro
    // associadas a ela, para não acumular imagens órfãs no banco.
    const { reports, changed } = stripEvidencesForClass(db.reports, id);
    if (changed) db.reports = reports;
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

// ==================== MATRIZ DE MIGRAÇÃO (SLA Chamado + Treinamento) ====================
export async function getMigrationRules(): Promise<MigrationSlaRule[]> {
  const db = await readDb();
  return db.migrationRules || [];
}

export async function saveMigrationRule(
  ruleData: Omit<MigrationSlaRule, 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<MigrationSlaRule> {
  const db = await readDb();
  const now = new Date().toISOString();

  if (ruleData.id) {
    const index = db.migrationRules.findIndex(r => r.id === ruleData.id);
    if (index !== -1) {
      const updated: MigrationSlaRule = {
        ...db.migrationRules[index],
        ...ruleData,
        id: ruleData.id,
        updatedAt: now,
      };
      db.migrationRules[index] = updated;
      await writeDb(db);
      return updated;
    }
  }

  const newRule: MigrationSlaRule = {
    ...ruleData,
    id: ruleData.id || `mig-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  db.migrationRules.push(newRule);
  await writeDb(db);
  return newRule;
}

export async function deleteMigrationRule(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.migrationRules.length;
  db.migrationRules = db.migrationRules.filter(r => r.id !== id);
  await writeDb(db);
  return db.migrationRules.length < before;
}

// ==================== CHAMADOS (tratativa de erros e solicitação de acessos) ====================
export async function getChamados(): Promise<Chamado[]> {
  const db = await readDb();
  return db.chamados || [];
}

export async function saveChamado(
  data: Omit<Chamado, 'createdAt' | 'updatedAt' | 'status'> & { id?: string; status?: Chamado['status'] }
): Promise<Chamado> {
  const db = await readDb();
  const now = new Date().toISOString();

  if (data.id) {
    const index = db.chamados.findIndex(c => c.id === data.id);
    if (index !== -1) {
      const updated: Chamado = {
        ...db.chamados[index],
        ...data,
        id: data.id,
        updatedAt: now,
      };
      db.chamados[index] = updated;
      await writeDb(db);
      return updated;
    }
  }

  const newChamado: Chamado = {
    ...data,
    id: data.id || `cham-${Date.now()}`,
    status: data.status || 'PENDENTE',
    createdAt: now,
    updatedAt: now,
  };
  db.chamados.push(newChamado);
  await writeDb(db);
  return newChamado;
}

export async function setChamadoStatus(id: string, status: Chamado['status']): Promise<Chamado | null> {
  const db = await readDb();
  const index = db.chamados.findIndex(c => c.id === id);
  if (index === -1) return null;

  const updated: Chamado = {
    ...db.chamados[index],
    status,
    approvedDate: status === 'APROVADO' ? new Date().toISOString().slice(0, 10) : undefined,
    updatedAt: new Date().toISOString(),
  };
  db.chamados[index] = updated;
  await writeDb(db);
  return updated;
}

export async function deleteChamado(id: string): Promise<boolean> {
  const db = await readDb();
  const before = db.chamados.length;
  db.chamados = db.chamados.filter(c => c.id !== id);
  await writeDb(db);
  return db.chamados.length < before;
}

// ==================== INSCRIÇÕES DE NOTIFICAÇÃO PUSH ====================
export async function getPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const db = await readDb();
  return db.pushSubscriptions || [];
}

export async function savePushSubscription(
  data: Omit<PushSubscriptionRecord, 'id' | 'createdAt'>
): Promise<PushSubscriptionRecord> {
  const db = await readDb();
  // Evita duplicar: se já existe uma inscrição com o mesmo endpoint, substitui.
  db.pushSubscriptions = (db.pushSubscriptions || []).filter(s => s.endpoint !== data.endpoint);
  const newSub: PushSubscriptionRecord = {
    ...data,
    id: `push-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.pushSubscriptions.push(newSub);
  await writeDb(db);
  return newSub;
}

export async function deletePushSubscriptionByEndpoint(endpoint: string): Promise<void> {
  const db = await readDb();
  db.pushSubscriptions = (db.pushSubscriptions || []).filter(s => s.endpoint !== endpoint);
  await writeDb(db);
}

/**
 * Remove inscrições inválidas (ex: navegador revogou a permissão) — chamado
 * pelo job diário quando o envio falha com erro 404/410 do serviço de push.
 */
export async function removeInvalidPushSubscriptions(endpoints: string[]): Promise<void> {
  if (endpoints.length === 0) return;
  const db = await readDb();
  const toRemove = new Set(endpoints);
  db.pushSubscriptions = (db.pushSubscriptions || []).filter(s => !toRemove.has(s.endpoint));
  await writeDb(db);
}
