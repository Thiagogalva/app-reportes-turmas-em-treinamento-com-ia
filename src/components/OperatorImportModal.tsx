'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Student } from '@/types';
import { parseOperatorsFromFile, downloadTemplateXlsx } from '@/lib/import-helpers';

interface OperatorImportModalProps {
  onClose: () => void;
  onConfirm: (students: Student[]) => void;
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'error';

export default function OperatorImportModal({ onClose, onConfirm }: OperatorImportModalProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [parsedStudents, setParsedStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      setErrorMsg('Formato inválido. Envie um arquivo .xlsx, .xls ou .csv.');
      setState('error');
      return;
    }

    setFileName(file.name);
    setState('parsing');
    setErrorMsg('');

    try {
      const students = await parseOperatorsFromFile(file);
      setParsedStudents(students);
      setState('preview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo.');
      setState('error');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleConfirm = () => {
    onConfirm(parsedStudents);
    onClose();
  };

  const handleReset = () => {
    setState('idle');
    setParsedStudents([]);
    setErrorMsg('');
    setFileName('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dark-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-dark-border">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-border bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 text-white flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Importar Operadores de Planilha
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Suporta arquivos .xlsx, .xls e .csv com colunas: Nome, Matrícula, Login de Rede, Login Cliente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

          {/* Botão Baixar Modelo */}
          <div className="flex items-center justify-between p-3 bg-dark-card rounded-xl border border-dark-border">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-white">Não sabe o formato?</p>
                <p className="text-[11px] text-dark-muted">Baixe o modelo de planilha para preencher</p>
              </div>
            </div>
            <button
              onClick={downloadTemplateXlsx}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Modelo
            </button>
          </div>

          {/* Estado: Idle / Drop Zone */}
          {(state === 'idle' || state === 'error') && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-blue-400 bg-blue-950/40'
                  : 'border-dark-border hover:border-blue-500/60 hover:bg-dark-card/60 bg-dark-card/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-800/50' : 'bg-dark-card'}`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-300' : 'text-dark-muted'}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste a planilha ou clique para selecionar'}
                </p>
                <p className="text-xs text-dark-muted mt-1">
                  Formatos aceitos: <strong className="text-slate-300">.xlsx</strong>, <strong className="text-slate-300">.xls</strong>, <strong className="text-slate-300">.csv</strong>
                </p>
              </div>
            </div>
          )}

          {/* Estado: Parsing */}
          {state === 'parsing' && (
            <div className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl bg-dark-card border border-dark-border">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">Processando planilha...</p>
                <p className="text-xs text-dark-muted mt-1 font-mono">{fileName}</p>
              </div>
            </div>
          )}

          {/* Estado: Error */}
          {state === 'error' && (
            <div className="p-4 rounded-xl bg-bradesco-950/60 border border-bradesco-800/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-bradesco-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-bradesco-300">Erro ao importar</p>
                <p className="text-xs text-bradesco-400 whitespace-pre-line">{errorMsg}</p>
                <button
                  onClick={handleReset}
                  className="text-xs text-white underline mt-1 hover:no-underline"
                >
                  Tentar outro arquivo
                </button>
              </div>
            </div>
          )}

          {/* Estado: Preview */}
          {state === 'preview' && (
            <div className="space-y-3">
              {/* Resumo */}
              <div className="flex items-center gap-3 p-3 bg-emerald-950/50 border border-emerald-800/50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-300">
                    {parsedStudents.length} operador{parsedStudents.length !== 1 ? 'es' : ''} encontrado{parsedStudents.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-emerald-500 truncate">Arquivo: {fileName}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-dark-muted hover:text-white transition-colors flex-shrink-0"
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Tabela de Preview */}
              <div className="border border-dark-border rounded-xl overflow-hidden">
                <div className="bg-dark-card px-3 py-2 flex items-center gap-2 border-b border-dark-border">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-bold text-white">Pré-visualização dos operadores</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-dark-bg">
                      <tr className="text-dark-muted font-bold border-b border-dark-border">
                        <th className="text-left px-3 py-2">#</th>
                        <th className="text-left px-3 py-2">Nome</th>
                        <th className="text-left px-3 py-2">Matrícula</th>
                        <th className="text-left px-3 py-2">Login Rede</th>
                        <th className="text-left px-3 py-2">Login Cliente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedStudents.map((st, i) => (
                        <tr
                          key={st.id}
                          className={`border-b border-dark-border/50 ${i % 2 === 0 ? 'bg-dark-card/30' : ''}`}
                        >
                          <td className="px-3 py-2 text-dark-muted">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold text-white max-w-[140px] truncate">
                            {st.name}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-300">{st.enrollmentNumber}</td>
                          <td className="px-3 py-2 font-mono text-bradesco-400">{st.networkLogin}</td>
                          <td className="px-3 py-2 font-mono text-blue-400">{st.clientLogin || '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border flex items-center justify-end gap-2 flex-shrink-0 bg-dark-bg/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-dark-muted hover:text-white transition-colors"
          >
            Cancelar
          </button>

          {state === 'preview' && (
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-bradesco-600 hover:bg-bradesco-700 text-white text-xs font-bold shadow-lg shadow-bradesco-600/30 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Confirmar Importação ({parsedStudents.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {(state === 'idle' || state === 'error') && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Selecionar Arquivo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
