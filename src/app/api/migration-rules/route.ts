import { NextRequest, NextResponse } from 'next/server';
import { getMigrationRules, saveMigrationRule, deleteMigrationRule } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const rules = await getMigrationRules();
    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem editar a matriz de migração.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.origin || !body.destination || body.chamadoSlaDays == null) {
      return NextResponse.json({ success: false, error: 'Origem, destino e SLA do chamado são obrigatórios.' }, { status: 400 });
    }
    const saved = await saveMigrationRule(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas administradores podem excluir regras da matriz.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório.' }, { status: 400 });
    }
    const deleted = await deleteMigrationRule(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
