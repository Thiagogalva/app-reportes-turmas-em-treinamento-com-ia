'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

type Status = 'unsupported' | 'checking' | 'denied' | 'subscribed' | 'unsubscribed';

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? 'subscribed' : 'unsubscribed');
      } catch {
        setStatus('unsubscribed');
      }
    })();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada.');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const subJson = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      setStatus('subscribed');
    } catch (err) {
      console.error('Erro ao ativar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('unsubscribed');
    } catch (err) {
      console.error('Erro ao desativar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'unsupported' || status === 'checking') return null;

  if (status === 'denied') {
    return (
      <button
        disabled
        title="Notificações bloqueadas no navegador. Libere nas configurações do site para ativar."
        className="p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted opacity-50 cursor-not-allowed"
      >
        <BellOff className="w-4 h-4" />
      </button>
    );
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={handleUnsubscribe}
        disabled={loading}
        title="Notificações ativadas — resumo diário às 15h. Clique para desativar."
        className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
      >
        <BellRing className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      title="Ativar resumo diário por notificação (às 15h)"
      className="p-2 rounded-xl bg-dark-card border border-dark-border text-dark-muted hover:text-white hover:border-bradesco-600/50 transition-colors disabled:opacity-50"
    >
      <Bell className="w-4 h-4" />
    </button>
  );
}
