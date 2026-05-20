import { useMemo, useState } from 'react';
import { Card, Badge, Button, EmptyState, BiIcon } from '../shared/UI';
import { useApp } from '../../context/AppContext';
import { STATUS } from '../../data/mockData';

// Simple QR code generator - generates a URL that can be used to display the code
function generateQRCodeURL(text) {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encoded}`;
}

export default function PreparationOrdonnances() {
  const { prepOrders, markOrderReady, markPreparationComplete } = useApp();
  const [actionError, setActionError] = useState('');
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  const paidOrders = useMemo(
    () => prepOrders.filter(order => order.status === STATUS.PAID),
    [prepOrders]
  );

  const preparingOrders = useMemo(
    () => prepOrders.filter(order => order.status === STATUS.PREPARING),
    [prepOrders]
  );

  const readyOrders = useMemo(
    () => prepOrders.filter(order => order.status === STATUS.READY_FOR_PICKUP),
    [prepOrders]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn .3s both' }}>
      {/* Section: À préparer */}
      <section>
        <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="flask" />A preparer ({paidOrders.length})</span>
        </div>

        {paidOrders.length === 0 ? (
          <EmptyState
            icon={<BiIcon name="check2-circle" size={40} />}
            title="Tout est prepare"
            description="Aucune ordonnance payee en attente de preparation."
          />
        ) : (
          paidOrders.map(order => (
            <PrepCard
              key={order.id}
              order={order}
              loading={loadingOrderId === order.id}
              onMarkReady={async () => {
                setActionError('');
                setLoadingOrderId(order.id);
                console.log('Prep: starting markOrderReady for', order.id);
                const ok = await markOrderReady(order.id);
                console.log('Prep: markOrderReady result for', order.id, ok);
                if (!ok) {
                  setActionError('Impossible de commencer la préparation pour le moment.');
                }
                setLoadingOrderId(null);
              }}
            />
          ))
        )}
      </section>

      {actionError && (
        <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--coral-50)', color: 'var(--coral-600)', fontSize: '13px', fontWeight: 600 }}>
          {actionError}
        </div>
      )}

      {/* Section: En préparation */}
      {preparingOrders.length > 0 && (
        <section>
          <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="hourglass-split" />En preparation ({preparingOrders.length})</span>
          </div>

          {preparingOrders.map(order => (
            <PreparingCard
              key={order.id}
              order={order}
              loading={loadingOrderId === order.id}
              onCompletePreparation={async () => {
                setActionError('');
                setLoadingOrderId(order.id);
                const result = await markPreparationComplete(order.id);
                if (!result) {
                  setActionError('Impossible de terminer la préparation pour le moment.');
                }
                setLoadingOrderId(null);
              }}
            />
          ))}
        </section>
      )}

      {/* Section: Prêtes et codes générés */}
      <section>
        <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check2-circle" />Ordonnances pretes ({readyOrders.length})</span>
        </div>

        {readyOrders.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>
            Les ordonnances marquees comme pretes apparaitront ici.
          </div>
        ) : (
          readyOrders.map(order => (
            <ReadyCard key={order.id} order={order} />
          ))
        )}
      </section>
    </div>
  );
}

function PrepCard({ order, onMarkReady, loading = false }) {
  const meds = order.meds || [];

  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--blue-50)',
        borderBottom: '1px solid rgba(59,138,221,.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue-800)' }}>{order.patientName}</div>
          <div style={{ fontSize: '12px', color: 'var(--blue-600)' }}>
            {order.id} - {(order.total || 0).toLocaleString()} FCFA
          </div>
        </div>
        <Badge status="processing" />
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medicaments a preparer
          </div>
          {meds.map((med, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--gray-50)' }}>
              <span>{med.name} x {med.qty || 1}</span>
              <span style={{ fontWeight: 600 }}>{(med.price || 0).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>

        <Button fullWidth variant="success" onClick={onMarkReady} disabled={loading}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="arrow-right-circle" />{loading ? 'Démarrage...' : 'Commencer la préparation'}</span>
        </Button>
      </div>
    </Card>
  );
}

function PreparingCard({ order, onCompletePreparation, loading = false }) {
  const meds = order.meds || [];

  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '12px', border: '2px solid var(--orange-300)', background: 'var(--orange-50)' }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(234, 179, 8, 0.15)',
        borderBottom: '1px solid var(--orange-200)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--orange-800)' }}>{order.patientName}</div>
          <div style={{ fontSize: '12px', color: 'var(--orange-700)' }}>
            {order.id} - {(order.total || 0).toLocaleString()} FCFA
          </div>
        </div>
        <Badge status="processing" />
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Medicaments en preparation
          </div>
          {meds.map((med, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span>{med.name} x {med.qty || 1}</span>
              <span style={{ fontWeight: 600 }}>{(med.price || 0).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>

        <Button fullWidth variant="success" onClick={onCompletePreparation} disabled={loading}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check2-circle" />{loading ? 'Finalisation...' : 'Préparation terminée - Générer codes'}</span>
        </Button>
      </div>
    </Card>
  );
}

function ReadyCard({ order }) {
  return (
    <Card style={{ border: '1px solid var(--green-300)', background: 'var(--green-50)', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-800)', marginBottom: '8px' }}>
            {order.patientName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginBottom: '12px' }}>
            {order.id} - {(order.total || 0).toLocaleString()} FCFA
          </div>
          
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Code de récupération
          </div>
          <div style={{ 
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--green-700)',
            letterSpacing: '2px',
            marginBottom: '12px',
            background: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            {order.pickupCode}
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <img
            src={generateQRCodeURL(order.qrCode)}
            alt="QR Code"
            style={{ maxWidth: '100%', borderRadius: '6px' }}
          />
          <div style={{ fontSize: '10px', color: 'var(--gray-600)', marginTop: '6px' }}>
            QR Code
          </div>
        </div>
      </div>
    </Card>
  );
}
