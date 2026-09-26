import { NextRequest, NextResponse } from 'next/server';
import { getClasses, saveClass, deleteClass } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('onlyActive') === 'true';
    const classes = await getClasses(onlyActive);
    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: 'Nome e código da turma são obrigatórios.' }, { status: 400 });
    }
    const saved = await saveClass(body);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da turma é obrigatório.' }, { status: 400 });
    }
    const deleted = await deleteClass(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
