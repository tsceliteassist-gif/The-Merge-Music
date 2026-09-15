import { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { apiFetch } from './lib/api';

type Item = { id: string; name: string; icon: string; coin_cost: number };

export default function GiftPanel({ roomId, recipientId, onClose, onSent }: { roomId: string; recipientId: string; onClose: () => void; onSent?: (id: string) => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from('gift_catalog').select('id,name,icon,coin_cost').eq('active', true).order('coin_cost').then(({ data }) => setItems((data as Item[]) ?? [])); }, []);
  async function send(gift: Item) {
    setBusy(true); setNotice('');
    try {
      const result = await apiFetch<{ transaction: { id: string } }>('/api/gifts/send', { method: 'POST', body: JSON.stringify({ roomId, receiverId: recipientId, giftId: gift.id, quantity: 1 }) });
      setNotice(`${gift.icon} ${gift.name} sent!`); onSent?.(result.transaction.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to send gift'); }
    finally { setBusy(false); }
  }
  return <div className="gift-overlay" onClick={onClose}><section className="gift-sheet" onClick={e => e.stopPropagation()}><button className="close" onClick={onClose}><X /></button><h2><Gift /> SEND A GIFT</h2><p>Support the live host with your available coin balance.</p><div className="gift-grid">{items.map(g => <button disabled={busy} key={g.id} onClick={() => send(g)}><b>{g.icon}</b><strong>{g.name}</strong><span>{g.coin_cost} coins</span></button>)}</div>{notice && <div className="notice">{notice}</div>}<small>Every gift is verified by the server and recorded in the creator ledger.</small></section></div>;
}
