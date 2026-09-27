import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE, VIEWER_COOKIE, SessionPayload, ViewerPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await verifyToken<SessionPayload>(sessionToken) : null;
  if (session?.scope === 'admin') {
    return NextResponse.json({ success: true, data: { scope: 'admin', sub: session.sub, username: session.username, name: session.name, role: session.role || 'instrutor' } });
  }

  const viewerToken = request.cookies.get(VIEWER_COOKIE)?.value;
  const viewerSession = viewerToken ? await verifyToken<ViewerPayload>(viewerToken) : null;
  if (viewerSession?.scope === 'viewer') {
    return NextResponse.json({ success: true, data: { scope: 'viewer' } });
  }

  return NextResponse.json({ success: false, data: null }, { status: 401 });
}
