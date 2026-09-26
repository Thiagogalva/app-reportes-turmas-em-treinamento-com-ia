import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import { readDb, writeDb } from './db';
import { AuthUser } from '@/types';

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = 'session';
const VIEWER_COOKIE = 'viewer_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

// ==================== SEGREDO DE ASSINATURA ====================
// Em produção, AUTH_SECRET é obrigatória (definida na Vercel). Em desenvolvimento
// local, se não estiver definida, geramos uma automaticamente em memória — válida
// apenas enquanto o processo `next dev` estiver rodando.
let devFallbackSecret: string | null = null;

function getAuthSecretString(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET não configurada. Defina uma variável de ambiente AUTH_SECRET com pelo menos 32 caracteres aleatórios.'
    );
  }

  if (!devFallbackSecret) {
    devFallbackSecret = randomBytes(32).toString('hex');
    console.warn(
      '[auth] AUTH_SECRET não definida — usando um segredo temporário só para desenvolvimento local. Sessões serão invalidadas ao reiniciar o servidor.'
    );
  }
  return devFallbackSecret;
}

function getAuthSecretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecretString());
}

// ==================== SENHAS (scrypt, sem dependências externas) ====================
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const stored = Buffer.from(hashHex, 'hex');
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

// ==================== SESSÕES (JWT, compatível com Edge/middleware) ====================
type SessionPayload = { scope: 'admin'; sub: string; username: string; name: string };
type ViewerPayload = { scope: 'viewer' };

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecretKey());
}

export async function createViewerToken(): Promise<string> {
  return new SignJWT({ scope: 'viewer' } satisfies ViewerPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecretKey());
}

export async function verifyToken<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey());
    return payload as T;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, VIEWER_COOKIE, SESSION_MAX_AGE_SECONDS };
export type { SessionPayload, ViewerPayload };

// ==================== BOOTSTRAP (primeiro admin + senha do viewer via env vars) ====================
// Roda sob demanda (chamado pelas rotas de login) em vez de a cada leitura do banco,
// para não gerar escrita extra em toda requisição.
export async function ensureBootstrap(): Promise<void> {
  const db = await readDb();
  let changed = false;

  if ((!db.users || db.users.length === 0) && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD);
    const newUser: AuthUser = {
      id: randomUUID(),
      username: process.env.ADMIN_USERNAME.trim().toLowerCase(),
      name: process.env.ADMIN_NAME?.trim() || 'Administrador',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users = [...(db.users || []), newUser];
    changed = true;
    console.info(`[auth] Usuário admin inicial criado a partir de ADMIN_USERNAME/ADMIN_PASSWORD ("${newUser.username}").`);
  }

  if (!db.settings.viewerPasswordHash && process.env.VIEWER_PASSWORD) {
    db.settings.viewerPasswordHash = await hashPassword(process.env.VIEWER_PASSWORD);
    changed = true;
    console.info('[auth] Senha do /viewer inicial criada a partir de VIEWER_PASSWORD.');
  }

  if (changed) {
    await writeDb(db);
  }
}
