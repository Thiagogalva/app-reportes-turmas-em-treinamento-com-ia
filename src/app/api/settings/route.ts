import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = await getSettings();
    // Nunca expõe o hash da senha do /viewer para o cliente.
    const { viewerPasswordHash, ...safeSettings } = settings;
    return NextResponse.json({ success: true, data: safeSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // viewerPasswordHash só pode ser alterado via /api/auth/change-viewer-password
    // (garante que sempre passe pelo hashing correto).
    delete body.viewerPasswordHash;
    const updated = await updateSettings(body);
    const { viewerPasswordHash, ...safeUpdated } = updated;
    return NextResponse.json({ success: true, data: safeUpdated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
