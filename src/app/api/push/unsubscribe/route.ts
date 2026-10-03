import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscriptionByEndpoint } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ success: false, error: 'endpoint é obrigatório.' }, { status: 400 });
    }

    await deletePushSubscriptionByEndpoint(endpoint);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
