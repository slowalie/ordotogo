import { useEffect, useState } from 'react';
import { Card, Button, BiIcon, Badge } from '../shared/UI';
import { PHARMACIES, STATUS } from '../../data/mockData';

// Simple QR code generator - generates a URL that can be used to display the code
function generateQRCodeURL(text) {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

export default function AttentePréparation({ orders = [], selectedOrderId, onSelectOrder }) {
  const [dots, setDots] = useState('');
  
  // Auto-select first order if none selected
  const activeOrderId = selectedOrderId || orders[0]?.id;
  const selectedOrder = orders.find(o => o.id === activeOrderId) || orders[0];
  
  const pharmacy = PHARMACIES.find(p => p.id === selectedOrder?.pharmacyId) || PHARMACIES[0];
  const isPreparing = selectedOrder?.status === STATUS.PREPARING;
  const isReady = selectedOrder?.status === STATUS.READY_FOR_PICKUP;

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(iv);
  }, []);

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-600)' }}>
          <BiIcon name="inbox" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div>Aucune préparation en attente</div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* List of pending preparation orders */}
      {orders.length > 1 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--blue-800)', marginBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <BiIcon name="stack" />
              {orders.length} ordonnance{orders.length > 1 ? 's' : ''} en attente de préparation
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.map(order => (
              <button
                key={order.id}
                onClick={() => onSelectOrder?.(order.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  border: activeOrderId === order.id ? '2px solid var(--blue-600)' : '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  background: activeOrderId === order.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all .2s',
                  fontSize: '14px',
                }}
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '2px' }}>
                    {PHARMACIES.find(p => p.id === order.pharmacyId)?.name || 'Pharmacie'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                    {order.id}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: order.status === STATUS.PREPARING ? 'var(--orange-600)' : 'var(--green-600)',
                    background: order.status === STATUS.PREPARING ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {order.status === STATUS.PREPARING ? 'En préparation' : 'Prêt à récupérer'}
                  </span>
                  {activeOrderId === order.id && <BiIcon name="check-circle-fill" size={16} style={{ color: 'var(--blue-600)' }} />}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Details for selected order */}
      {selectedOrder && (
        <>
          {isPreparing && (
            <Card className="waiting-card">
              <div className="waiting-card__spinner">
                <div style={{ fontSize: '40px', animation: 'spin 2s linear infinite' }}>⚙️</div>
              </div>
              <div className="waiting-card__title">
                Préparation en cours
              </div>
              <div className="waiting-card__text">
                Le pharmacien de <strong>{pharmacy.name}</strong> prépare vos médicaments{dots}
              </div>
              <div className="waiting-pill">
                <BiIcon name="hourglass-split" size={13} /> Traitement en cours
              </div>
            </Card>
          )}

          {isReady && selectedOrder.pickupCode && (
            <Card style={{ border: '2px solid var(--green-500)', background: 'var(--green-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BiIcon name="check2-circle" size={24} style={{ color: 'var(--green-600)' }} />
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green-800)' }}>
                  Prêt à récupérer !
                </span>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', textAlign: 'center' }}>
                <img
                  src={generateQRCodeURL(selectedOrder.qrCode)}
                  alt="QR Code"
                  style={{ maxWidth: '200px', margin: '0 auto', display: 'block' }}
                />
              </div>

              <div style={{ 
                padding: '16px', 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: 'var(--radius)',
                marginBottom: '16px',
                textAlign: 'center',
                border: '2px solid var(--green-300)'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Code de récupération
                </div>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 700, 
                  color: 'var(--green-700)',
                  fontFamily: 'monospace',
                  letterSpacing: '4px'
                }}>
                  {selectedOrder.pickupCode}
                </div>
              </div>

              <div style={{ 
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                color: 'var(--blue-700)',
                marginBottom: '16px'
              }}>
                <BiIcon name="info-circle" size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Montrez l'un de ces deux codes au pharmacien pour valider la récupération
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <div style={{ flex: 1, color: 'var(--gray-600)' }}>
                  <BiIcon name="bag-check" size={14} /> Montant: <strong>{(selectedOrder.total || 0).toLocaleString()} FCFA</strong>
                </div>
              </div>
            </Card>
          )}

          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Médicaments
            </div>
            {(selectedOrder.meds || []).map((med, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', padding: '8px 0', borderBottom: idx < (selectedOrder.meds || []).length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                <span>{med.name} x {med.qty || 1}</span>
                <span style={{ fontWeight: 600 }}>{(med.price || 0).toLocaleString()} FCFA</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
