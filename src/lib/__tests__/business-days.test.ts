import { describe, it, expect } from 'vitest';
import { addBusinessDays } from '../business-days';

describe('addBusinessDays', () => {
  it('soma dias úteis pulando o fim de semana', () => {
    // 2026-09-28 é segunda-feira. +5 dias úteis = seg a sex da outra semana = 2026-10-05? Vamos conferir manualmente.
    // 29(ter),30(qua),10-01(qui),10-02(sex),10-05(seg) = 5 dias úteis
    expect(addBusinessDays('2026-09-28', 5)).toBe('2026-10-05');
  });

  it('partindo de uma sexta-feira, 1 dia útil cai na segunda seguinte', () => {
    // 2026-10-02 é sexta-feira
    expect(addBusinessDays('2026-10-02', 1)).toBe('2026-10-05');
  });

  it('partindo de um sábado, 1 dia útil cai na segunda (pula domingo também)', () => {
    // 2026-10-03 é sábado
    expect(addBusinessDays('2026-10-03', 1)).toBe('2026-10-05');
  });

  it('0 dias úteis retorna a mesma data', () => {
    expect(addBusinessDays('2026-09-28', 0)).toBe('2026-09-28');
  });

  it('confere o exemplo real usado na matriz de migração: 2026-09-28 + 16 DU', () => {
    expect(addBusinessDays('2026-09-28', 16)).toBe('2026-10-20');
  });

  it('nunca retorna uma data que caia em fim de semana', () => {
    for (let i = 1; i <= 30; i++) {
      const result = addBusinessDays('2026-09-28', i);
      const [y, m, d] = result.split('-').map(Number);
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      expect(dow).not.toBe(0); // domingo
      expect(dow).not.toBe(6); // sábado
    }
  });
});
