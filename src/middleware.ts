import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// O middleware roda em Edge Runtime, então não pode importar src/lib/db.ts
// (que usa 'fs' e o driver do Postgres). Por isso a verificação do token é
// feita aqui de forma independente, usando apenas 'jose' (compatível com Edge).

const SESSION_COOKIE = 'session';
const VIEWER_COOKIE = 'viewer_session';

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || 'dev-fallback-secret-nao-use-em-producao';
  return new TextEncoder().encode(secret);
}

async function isValidToken(token: string | undefined, expectedScope: string): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.scope === expectedScope;
  } catch {
    return false;
  }
}

// Rotas de API que só fazem LEITURA e que o /viewer precisa consultar.
const VIEWER_READABLE_API_PREFIXES = ['/api/classes', '/api/reports'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const viewerToken = request.cookies.get(VIEWER_COOKIE)?.value;

  const hasAdminSession = await isValidToken(sessionToken, 'admin');

  // ─── Páginas e API públicas de autenticação ───────────────────────────────
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/viewer/login' ||
    pathname.startsWith('/api/auth/viewer-login') ||
    pathname.startsWith('/api/auth/viewer-logout')
  ) {
    return NextResponse.next();
  }

  // ─── Área /viewer (somente leitura, senha própria) ────────────────────────
  if (pathname.startsWith('/viewer')) {
    if (hasAdminSession) return NextResponse.next(); // admin sempre pode ver
    const hasViewerSession = await isValidToken(viewerToken, 'viewer');
    if (hasViewerSession) return NextResponse.next();
    return NextResponse.redirect(new URL('/viewer/login', request.url));
  }

  // ─── APIs de leitura que o /viewer consome (GET liberado p/ viewer_session) ─
  if (VIEWER_READABLE_API_PREFIXES.some(p => pathname.startsWith(p)) && request.method === 'GET') {
    if (hasAdminSession) return NextResponse.next();
    const hasViewerSession = await isValidToken(viewerToken, 'viewer');
    if (hasViewerSession) return NextResponse.next();
    return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
  }

  // ─── Resto do sistema (todas as páginas + todas as outras APIs) ───────────
  if (hasAdminSession) return NextResponse.next();

  if (pathname.startsWith('/api')) {
    return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, exceto:
     * - arquivos estáticos do Next (_next/static, _next/image)
     * - favicon, manifest, ícones do PWA
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192.png|icon-512.png).*)',
  ],
};
