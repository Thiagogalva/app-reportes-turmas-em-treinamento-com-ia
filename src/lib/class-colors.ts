// Paleta de cores de destaque dos cards de turma (Dashboard).
export const CLASS_COLORS: { name: string; hex: string }[] = [
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Âmbar', hex: '#f59e0b' },
  { name: 'Verde', hex: '#22c55e' },
  { name: 'Turquesa', hex: '#14b8a6' },
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Roxo', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
];

export function isValidClassColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** Versão translúcida da cor, usada como fundo do card. */
export function tintColor(hex: string, alphaHex = '1f'): string {
  return `${hex}${alphaHex}`;
}
