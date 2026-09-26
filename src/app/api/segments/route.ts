import { NextRequest, NextResponse } from 'next/server';
import { getSegments, getSegmentById, saveSegment, deleteSegment } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const segment = await getSegmentById(id);
      if (!segment) {
        return NextResponse.json({ success: false, error: 'Segmento não encontrado.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: segment });
    }

    const segments = await getSegments();
    return NextResponse.json({ success: true, data: segments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'O nome do segmento é obrigatório.' }, { status: 400 });
    }

    const saved = await saveSegment(body);
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
      return NextResponse.json({ success: false, error: 'ID do segmento é obrigatório.' }, { status: 400 });
    }
    const deleted = await deleteSegment(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
