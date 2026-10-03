import webpush from 'web-push';
import { PushSubscriptionRecord } from '@/types';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY não configuradas — notificações push desativadas.');
  }
  webpush.setVapidDetails('mailto:suporte@treinareport.local', publicKey, privateKey);
  configured = true;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

/**
 * Envia uma notificação push para uma inscrição específica. Retorna false
 * (sem lançar erro) se a inscrição estiver expirada/inválida (404/410) — o
 * chamador deve então removê-la do banco.
 */
export async function sendPushToSubscription(sub: PushSubscriptionRecord, message: PushMessage): Promise<boolean> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      JSON.stringify(message)
    );
    return true;
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      return false; // inscrição expirada — remover
    }
    console.error(`Erro ao enviar push para ${sub.username}:`, error?.message || error);
    return true; // erro transitório — mantém a inscrição
  }
}
