import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, namesMatch } from '../auth';

describe('hashPassword / verifyPassword', () => {
  it('a senha correta passa na verificação', async () => {
    const hash = await hashPassword('minhaSenha123');
    expect(await verifyPassword('minhaSenha123', hash)).toBe(true);
  });

  it('uma senha errada NÃO passa na verificação', async () => {
    const hash = await hashPassword('minhaSenha123');
    expect(await verifyPassword('senhaErrada', hash)).toBe(false);
  });

  it('o hash nunca armazena a senha em texto puro', async () => {
    const hash = await hashPassword('minhaSenha123');
    expect(hash).not.toContain('minhaSenha123');
  });

  it('duas senhas iguais geram hashes DIFERENTES (salt aleatório)', async () => {
    const hash1 = await hashPassword('mesmaSenha');
    const hash2 = await hashPassword('mesmaSenha');
    expect(hash1).not.toBe(hash2);
    // mas ambas continuam válidas
    expect(await verifyPassword('mesmaSenha', hash1)).toBe(true);
    expect(await verifyPassword('mesmaSenha', hash2)).toBe(true);
  });

  it('hash malformado (sem salt) retorna false em vez de lançar erro', async () => {
    expect(await verifyPassword('qualquer', 'hash-sem-dois-pontos')).toBe(false);
  });
});

describe('namesMatch', () => {
  it('nomes idênticos batem', () => {
    expect(namesMatch('Maria Silva', 'Maria Silva')).toBe(true);
  });

  it('ignora diferença de maiúsculas/minúsculas', () => {
    expect(namesMatch('maria silva', 'MARIA SILVA')).toBe(true);
  });

  it('ignora espaços extras nas pontas', () => {
    expect(namesMatch('  Maria Silva  ', 'Maria Silva')).toBe(true);
  });

  it('nomes diferentes não batem', () => {
    expect(namesMatch('Maria Silva', 'João Souza')).toBe(false);
  });

  it('retorna false quando um dos nomes é undefined', () => {
    expect(namesMatch(undefined, 'Maria Silva')).toBe(false);
    expect(namesMatch('Maria Silva', undefined)).toBe(false);
  });

  it('retorna false quando um dos nomes é string vazia', () => {
    expect(namesMatch('', 'Maria Silva')).toBe(false);
  });
});
