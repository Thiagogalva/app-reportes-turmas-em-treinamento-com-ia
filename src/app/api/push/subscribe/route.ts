import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ success: false, error: 'Dados de inscrição inválidos.' }, { status: 400 });
    }

    const saved = await savePushSubscription({
      userId: session.sub,
      username: session.username,
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
