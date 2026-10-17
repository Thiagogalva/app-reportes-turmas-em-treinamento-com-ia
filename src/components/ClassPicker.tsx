'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, Palette, Check, X, User, Hash, CalendarDays, Layers } from 'lucide-react';
import { ClassGroup } from '@/types';
import { CLASS_COLORS, tintColor } from '@/lib/class-colors';
import { formatDatePtBr } from '@/lib/sla';

interface ClassPickerProps {
  classes: ClassGroup[];
  selectedId: string;
  onSelect: (id: string) => void;
  onColorChange: (classId: string, color: string | null) => Promise<void> | void;
}

export default function ClassPicker({ classes, selectedId, onSelect, onColorChange }: ClassPickerProps) {
  const [query, setQuery] = useState('');
  const [paletteOpenId, setPaletteOpenId] = useState<string | null>(null);
  const [savingColorId, setSavingColorId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha a paleta ao clicar fora.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPaletteOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      [c.name, c.code, c.instructor, c.segmentName].some(v => (v || '').toLowerCase().includes(q))
    );
  }, [classes, query]);

  const handlePickColor = async (classId: string, color: string | null) => {
    setSavingColorId(classId);
    try {
      await onColorChange(classId, color);
    } finally {
      setSavingColorId(null);
      setPaletteOpenId(null);
    }
  };

  return (
    <div ref={containerRef} className="bg-dark-surface rounded-2xl p-4 sm:p-5 border border-dark-border shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-dark-muted uppercase tracking-wide">
          Turmas em treinamento ({filtered.length}{filtered.length !== classes.length ? ` de ${classes.length}` : ''})
        </h2>
        {classes.length > 4 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-dark-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome, código ou instrutor..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-white placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-bradesco-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-dark-muted py-2">Nenhuma turma encontrada para &ldquo;{query}&rdquo;.</p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {filtered.map(c => {
            const selected = c.id === selectedId;
            const color = c.color;
            return (
              <div key={c.id} className="relative group">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-pressed={selected}
                  className={`relative text-left pl-4 pr-9 py-2.5 rounded-xl border min-w-[9.5rem] max-w-[15rem] transition-all ${
                    selected
                      ? 'border-bradesco-500 shadow-lg shadow-bradesco-600/20'
                      : 'border-dark-border hover:border-dark-muted'
                  }`}
                  style={{
                    backgroundColor: color ? tintColor(color, selected ? '33' : '1f') : selected ? 'rgba(204,9,47,0.12)' : undefined,
                  }}
                >
                  {/* faixa de cor lateral */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                    style={{ backgroundColor: color || (selected ? '#cc092f' : '#2a3441') }}
                  />
                  <span className="block text-xs font-bold text-white truncate">{c.name}</span>
                  <span className="block text-[10px] text-dark-muted mt-0.5">
                    {selected ? 'Turma selecionada' : 'Clique para ver'}
                  </span>
                </button>

                {/* botão de cor */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setPaletteOpenId(paletteOpenId === c.id ? null : c.id);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg text-dark-muted hover:text-white hover:bg-dark-bg/70 transition-colors"
                  title="Personalizar cor do card"
                  aria-label={`Personalizar cor da turma ${c.name}`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>

                {/* paleta de cores */}
                {paletteOpenId === c.id && (
                  <div className="absolute z-30 right-0 top-full mt-1.5 p-2.5 rounded-xl bg-dark-card border border-dark-border shadow-2xl w-[11.5rem]">
                    <p className="text-[10px] font-bold text-dark-muted mb-2">Cor do card</p>
                    <div className="grid grid-cols-4 gap-2">
                      {CLASS_COLORS.map(opt => (
                        <button
                          key={opt.hex}
                          type="button"
                          disabled={savingColorId === c.id}
                          onClick={() => handlePickColor(c.id, opt.hex)}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: opt.hex, borderColor: color === opt.hex ? '#ffffff' : 'transparent' }}
                          title={opt.name}
                          aria-label={opt.name}
                        >
                          {color === opt.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={savingColorId === c.id || !color}
                      onClick={() => handlePickColor(c.id, null)}
                      className="mt-2.5 w-full text-[10px] font-bold py-1.5 rounded-lg bg-dark-bg border border-dark-border text-dark-muted hover:text-white disabled:opacity-40"
                    >
                      Remover cor
                    </button>
                  </div>
                )}

                {/* detalhes ao passar o mouse (ou focar/tocar) */}
                {paletteOpenId !== c.id && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute z-20 left-0 top-full mt-1.5 w-60 p-3 rounded-xl bg-dark-card border border-dark-border shadow-2xl space-y-1.5 opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
                  >
                    <p className="text-xs font-bold text-white leading-snug">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-[11px] text-dark-text">
                      <Hash className="w-3 h-3 text-bradesco-500 flex-shrink-0" />
                      <span className="text-dark-muted">Código:</span> <strong className="text-white">{c.code}</strong>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-dark-text">
                      <User className="w-3 h-3 text-bradesco-500 flex-shrink-0" />
                      <span className="text-dark-muted">Instrutor:</span> <strong className="text-white">{c.instructor || '—'}</strong>
                    </p>
                    {c.segmentName && (
                      <p className="flex items-center gap-1.5 text-[11px] text-dark-text">
                        <Layers className="w-3 h-3 text-bradesco-500 flex-shrink-0" />
                        <span className="text-dark-muted">Segmento:</span> <strong className="text-white">{c.segmentName}</strong>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-[11px] text-dark-text">
                      <CalendarDays className="w-3 h-3 text-bradesco-500 flex-shrink-0" />
                      <span className="text-dark-muted">Início:</span> <strong className="text-white">{formatDatePtBr(c.startDate)}</strong>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
