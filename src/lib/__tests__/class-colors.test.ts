import { describe, it, expect } from 'vitest';
import { CLASS_COLORS, isValidClassColor, tintColor } from '../class-colors';

describe('isValidClassColor', () => {
  it('aceita hex #RRGGBB (maiúsculo ou minúsculo)', () => {
    expect(isValidClassColor('#3b82f6')).toBe(true);
    expect(isValidClassColor('#3B82F6')).toBe(true);
  });
  it('rejeita formatos inválidos e tipos errados', () => {
    expect(isValidClassColor('3b82f6')).toBe(false);
    expect(isValidClassColor('#fff')).toBe(false);
    expect(isValidClassColor('red')).toBe(false);
    expect(isValidClassColor('#gggggg')).toBe(false);
    expect(isValidClassColor('url(javascript:alert(1))')).toBe(false);
    expect(isValidClassColor(null)).toBe(false);
    expect(isValidClassColor(123)).toBe(false);
  });
  it('todas as cores da paleta são válidas', () => {
    expect(CLASS_COLORS.every(c => isValidClassColor(c.hex))).toBe(true);
  });
});

describe('tintColor', () => {
  it('acrescenta transparência ao hex', () => {
    expect(tintColor('#3b82f6')).toBe('#3b82f61f');
    expect(tintColor('#3b82f6', '33')).toBe('#3b82f633');
  });
});
