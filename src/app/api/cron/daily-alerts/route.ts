import { NextRequest, NextResponse } from 'next/server';
import { getClasses, getSegments, getReports, getChamados, getPushSubscriptions, removeInvalidPushSubscriptions, readDb } from '@/lib/db';
import { sendPushToSubscription } from '@/lib/push';
import { evaluateClassSlaImpact } from '@/lib/sla';
import { evaluateClassScheduleDeviation } from '@/lib/schedule';
import { evaluateClassAdherence } from '@/lib/adherence';
import { todayStr, addDays } from '@/lib/sla';
import { namesMatch } from '@/lib/auth';
import { ClassGroup, DailyReport } from '@/types';

export async function GET(request: NextRequest) {
  // Protege o endpoint: só a Vercel (com o CRON_SECRET) pode disparar isso.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const [allClasses, segments, reports, chamados, subscriptions] = await Promise.all([
      getClasses(true), // só turmas ativas
      getSegments(),
      getReports(),
      getChamados(),
      getPushSubscriptions(),
    ]);
    const db = await readDb(); // para mapear username -> role/name

    const today = todayStr();

    function computeDigestFor(classes: ClassGroup[], classIds: Set<string> | null): PushDigest {
      const scopedChamados = classIds ? chamados.filter(c => classIds.has(c.classId)) : chamados;

      const slaImpactedCount = classes.filter(c => evaluateClassSlaImpact(c, segments).impacted).length;
      const scheduleDeviationCount = classes.filter(c => evaluateClassScheduleDeviation(c).alert).length;
      const chamadosOverdueCount = scopedChamados.filter(ch => {
        if (ch.status === 'APROVADO') return false;
        const deadline = addDays(ch.openedDate, ch.slaDays);
        return deadline < today;
      }).length;
      const lowAdherenceCount = classes.filter(c => {
        const result = evaluateClassAdherence(c, reports);
        return result.expectedDays.length >= 3 && result.adherencePercent < 70;
      }).length;

      return { slaImpactedCount, scheduleDeviationCount, chamadosOverdueCount, lowAdherenceCount };
    }

    function digestToMessage(d: PushDigest): string | null {
      const parts: string[] = [];
      if (d.slaImpactedCount > 0) parts.push(`${d.slaImpactedCount} turma(s) com impacto de SLA`);
      if (d.scheduleDeviationCount > 0) parts.push(`${d.scheduleDeviationCount} turma(s) com desvio de cronograma`);
      if (d.chamadosOverdueCount > 0) parts.push(`${d.chamadosOverdueCount} chamado(s) fora do prazo`);
      if (d.lowAdherenceCount > 0) parts.push(`${d.lowAdherenceCount} turma(s) com baixa aderência`);
      if (parts.length === 0) return null;
      return parts.join(' · ');
    }

    let sent = 0;
    const invalidEndpoints: string[] = [];

    // Agrupa inscrições por usuário (um usuário pode ter mais de um dispositivo).
    for (const sub of subscriptions) {
      const user = db.users.find(u => u.id === sub.userId);
      const isAdmin = user?.role === 'admin';

      const userClasses = isAdmin
        ? allClasses
        : allClasses.filter(c => namesMatch(c.instructor, sub.username) || namesMatch(c.instructor, user?.name));
      const userClassIds = isAdmin ? null : new Set(userClasses.map(c => c.id));

      const digest = computeDigestFor(userClasses, userClassIds);
      const body = digestToMessage(digest);
      if (!body) continue; // nada relevante pra esse usuário hoje — não notifica

      const ok = await sendPushToSubscription(sub, {
        title: '📊 Resumo diário — TreinaReport AI',
        body,
        url: '/',
      });
      if (ok) sent++;
      else invalidEndpoints.push(sub.endpoint);
    }

    if (invalidEndpoints.length > 0) {
      await removeInvalidPushSubscriptions(invalidEndpoints);
    }

    return NextResponse.json({ success: true, sent, totalSubscriptions: subscriptions.length, removedInvalid: invalidEndpoints.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

interface PushDigest {
  slaImpactedCount: number;
  scheduleDeviationCount: number;
  chamadosOverdueCount: number;
  lowAdherenceCount: number;
}
