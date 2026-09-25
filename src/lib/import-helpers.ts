/**
 * import-helpers.ts
 * Utilitários para importar operadores de planilhas Excel/CSV.
 * Usa a biblioteca SheetJS (xlsx) já instalada no projeto.
 */

import * as XLSX from 'xlsx';
import { Student } from '@/types';

/** Mapeamento de possíveis nomes de coluna → campo interno */
const COLUMN_MAP: Record<string, keyof ParsedRow> = {
  // Nome
  nome: 'name',
  name: 'name',
  operador: 'name',
  'nome do operador': 'name',
  colaborador: 'name',
  funcionário: 'name',
  funcionario: 'name',

  // Matrícula
  matrícula: 'enrollmentNumber',
  matricula: 'enrollmentNumber',
  'n° matrícula': 'enrollmentNumber',
  'no matricula': 'enrollmentNumber',
  enrollment: 'enrollmentNumber',
  'enrollment number': 'enrollmentNumber',
  mat: 'enrollmentNumber',

  // Login de Rede
  'login de rede': 'networkLogin',
  'login rede': 'networkLogin',
  rede: 'networkLogin',
  'network login': 'networkLogin',
  networklogin: 'networkLogin',
  'login de acesso': 'networkLogin',
  'usuario de rede': 'networkLogin',
  'usuário de rede': 'networkLogin',

  // Login Cliente
  'login cliente': 'clientLogin',
  'login do cliente': 'clientLogin',
  cliente: 'clientLogin',
  'client login': 'clientLogin',
  clientlogin: 'clientLogin',
  'login cli': 'clientLogin',

  // E-mail (opcional)
  email: 'email',
  'e-mail': 'email',
  'e mail': 'email',
  correio: 'email',
};

interface ParsedRow {
  name?: string;
  enrollmentNumber?: string;
  networkLogin?: string;
  clientLogin?: string;
  email?: string;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9 ]/g, ' ')    // remove caracteres especiais
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Lê um arquivo .xlsx, .xls ou .csv e retorna uma lista de Student[].
 * A detecção de colunas é flexível (case-insensitive, sem acento).
 */
export async function parseOperatorsFromFile(file: File): Promise<Student[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Usa a primeira aba da planilha
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Converte para array de objetos com cabeçalhos como chave
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error('A planilha está vazia ou não possui dados.');
  }

  // Descobre mapeamento de cabeçalhos originais → campo interno
  const firstRow = rawRows[0];
  const headerMapping: Record<string, keyof ParsedRow> = {};

  for (const originalHeader of Object.keys(firstRow)) {
    const normalized = normalizeHeader(String(originalHeader));
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      headerMapping[originalHeader] = mapped;
    }
  }

  if (!headerMapping || !Object.values(headerMapping).includes('name')) {
    throw new Error(
      'Coluna "Nome" não encontrada na planilha.\n\n' +
      'Certifique-se de que a primeira linha da planilha contém cabeçalhos como:\n' +
      'Nome | Matrícula | Login de Rede | Login Cliente'
    );
  }

  const students: Student[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const parsed: ParsedRow = {};

    for (const [originalHeader, field] of Object.entries(headerMapping)) {
      const val = String(row[originalHeader] ?? '').trim();
      if (val) {
        parsed[field] = val;
      }
    }

    // Ignora linhas sem nome
    if (!parsed.name) continue;

    // Gera valores padrão para campos obrigatórios ausentes
    const student: Student = {
      id: `imp-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
      name: parsed.name,
      enrollmentNumber: parsed.enrollmentNumber || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      networkLogin: parsed.networkLogin || `B${Math.floor(100000 + Math.random() * 900000)}`,
      clientLogin: parsed.clientLogin || undefined,
      email: parsed.email || undefined,
      active: true,
    };

    students.push(student);
  }

  if (students.length === 0) {
    throw new Error('Nenhum operador válido encontrado na planilha. Verifique se os dados estão preenchidos.');
  }

  return students;
}

/**
 * Gera um arquivo modelo (.xlsx) para download, com as colunas esperadas.
 */
export function downloadTemplateXlsx(): void {
  const templateData = [
    {
      'Nome': 'Ana Beatriz Ferreira',
      'Matrícula': 'MAT-9011',
      'Login de Rede': 'B812341',
      'Login Cliente': 'CLI-VAR-101',
      'Email': 'ana.beatriz@bradesco.com.br',
    },
    {
      'Nome': 'Carlos Eduardo Lima',
      'Matrícula': 'MAT-9012',
      'Login de Rede': 'B812342',
      'Login Cliente': 'CLI-VAR-102',
      'Email': 'carlos.lima@bradesco.com.br',
    },
    {
      'Nome': 'Fernanda Souza',
      'Matrícula': 'MAT-9013',
      'Login de Rede': 'B812343',
      'Login Cliente': 'CLI-VAR-103',
      'Email': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Largura das colunas
  ws['!cols'] = [
    { wch: 28 }, // Nome
    { wch: 15 }, // Matrícula
    { wch: 16 }, // Login de Rede
    { wch: 16 }, // Login Cliente
    { wch: 32 }, // Email
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Operadores');

  XLSX.writeFile(wb, 'modelo_importacao_operadores.xlsx');
}
