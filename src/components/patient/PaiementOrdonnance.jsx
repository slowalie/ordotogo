import { useState } from 'react';
import { Card, Button, Divider, BiIcon } from '../shared/UI';
import { PHARMACIES } from '../../data/mockData';

const PAYMENT_METHODS = [
  {
    id:    'mixx',
    icon:  'phone',
    name:  'Mixx by Yass',
    desc:  'Paiement mobile sécurisé',
    detail:'Commande préparée dès confirmation. Récupérez avec votre QR code.',
    color: 'var(--blue-50)',
    border:'var(--blue-400)',
    text:  'var(--blue-800)',
  },
  {
    id:    'pharmacy',
    icon:  'shop',
    name:  'En pharmacie',
    desc:  'Payer à la récupération',
    detail:'Rendez-vous directement en pharmacie. Payez et récupérez sur place.',
    color: 'var(--amber-50)',
    border:'var(--amber-400)',
    text:  'var(--amber-600)',
  },
];

export default function PaiementOrdonnance({ pharmacyId, meds = [], total = 0, onConfirm }) {
  const [method,  setMethod]  = useState('pharmacy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pharmacy = PHARMACIES.find(p => p.id === pharmacyId) || PHARMACIES[0];
  const selected = PAYMENT_METHODS.find(m => m.id === method);

  const handleConfirm = async () => {
    if (!method || loading) return;
    setError('');
    setLoading(true);
    try {
      const saved = await onConfirm(method);
      if (saved === false) {
        setError('Impossible de confirmer la récupération pour le moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* Payment choice */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green-800)', marginBottom: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="credit-card-2-front" />Mode de paiement</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {PAYMENT_METHODS.map(pm => (
            <div
              key={pm.id}
              onClick={() => setMethod(pm.id)}
              style={{
                padding:      '16px 12px',
                borderRadius: 'var(--radius-md)',
                border:       `2px solid ${method === pm.id ? pm.border : 'var(--color-border)'}`,
                background:   method === pm.id ? pm.color : 'white',
                cursor:       'pointer',
                textAlign:    'center',
                transition:   'all var(--transition)',
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '6px', color: 'var(--green-600)' }}><BiIcon name={pm.icon} size={28} /></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '3px' }}>{pm.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{pm.desc}</div>
            </div>
          ))}
        </div>

        {/* Method detail */}
        {selected && (
          <div style={{
            marginTop:    '14px',
            padding:      '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background:   selected.color,
            border:       `1px solid ${selected.border}`,
            fontSize:     '13px',
            color:        selected.text,
            lineHeight:   1.5,
            animation:    'fadeIn .2s both',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="info-circle" size={14} />{selected.detail}</span>
          </div>
        )}
      </Card>

      {/* Pharmacy */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="geo-alt" />{pharmacy.name}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {pharmacy.zone} · {pharmacy.dist} · {pharmacy.phone}
        </div>
      </Card>

      {/* Summary */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="receipt" />Récapitulatif</span>
        </div>
        {meds.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>{m.name} × {m.qty || 1}</span>
            <span>{m.price.toLocaleString()} FCFA</span>
          </div>
        ))}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--green-800)' }}>
          <span>Total</span>
          <span>{total.toLocaleString()} FCFA</span>
        </div>

        <Button
          fullWidth
          disabled={!method || loading}
          onClick={handleConfirm}
          style={{ marginTop: '16px' }}
        >
          {loading
            ? 'Confirmation...'
            : method === 'mixx'
            ? 'Payer avec Mixx by Yass →'
            : 'Confirmer la récupération →'
          }
        </Button>
        {error && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--coral-600)' }}>
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
