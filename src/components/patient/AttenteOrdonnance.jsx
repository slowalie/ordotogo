import { useEffect, useMemo, useState } from 'react';
import { Card, Spinner, BiIcon } from '../shared/UI';
import { PHARMACIES, STATUS } from '../../data/mockData';

function formatClock(isoDate) {
  if (!isoDate) return '--:--';
  return new Date(isoDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getStatusLabel(status) {
  const labels = {
    [STATUS.PENDING]: 'En attente',
    [STATUS.PROCESSING]: 'En cours de transcription',
    [STATUS.WAITING_VALIDATION]: 'En attente de validation',
    [STATUS.VALIDATED]: 'Validée',
  };
  return labels[status] || status;
}

export default function AttenteOrdonnance({ orders = [], selectedOrderId, onSelectOrder }) {
  const [dots, setDots] = useState('');
  const [now, setNow] = useState(Date.now());
  
  // Auto-select first order if none selected
  const activeOrderId = selectedOrderId || orders[0]?.id;
  const selectedOrder = orders.find(o => o.id === activeOrderId) || orders[0];
  
  const pharmacy = PHARMACIES.find(p => p.id === selectedOrder?.pharmacyId) || PHARMACIES[0];
  const isAnalyzing = selectedOrder?.status === STATUS.PENDING || selectedOrder?.status === STATUS.PROCESSING;

  const elapsedMinutes = useMemo(() => {
    if (!selectedOrder?.sentAt) return 0;
    return Math.max(0, Math.floor((now - new Date(selectedOrder.sentAt).getTime()) / 60000));
  }, [now, selectedOrder?.sentAt]);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-600)' }}>
          <BiIcon name="inbox" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div>Aucune ordonnance en attente</div>
        </div>
      </Card>
    );
  }

  const waitingSteps = [
    { id: 'sent', label: 'Ordonnance envoyée', done: true, current: false },
    { id: 'transcription', label: 'Transcription pharmacien', done: !isAnalyzing, current: isAnalyzing },
    { id: 'validation', label: 'Validation patient', done: false, current: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* List of pending orders */}
      {orders.length > 1 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <BiIcon name="stack" />
              {orders.length} ordonnance{orders.length > 1 ? 's' : ''} en attente
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
                  border: activeOrderId === order.id ? '2px solid var(--green-600)' : '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius)',
                  background: activeOrderId === order.id ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
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
                    Envoyée à {formatClock(order.sentAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: order.status === STATUS.PENDING ? 'var(--orange-600)' : 
                           order.status === STATUS.PROCESSING ? 'var(--blue-600)' :
                           order.status === STATUS.WAITING_VALIDATION ? 'var(--purple-600)' :
                           'var(--green-600)',
                    background: order.status === STATUS.PENDING ? 'rgba(234, 179, 8, 0.1)' :
                               order.status === STATUS.PROCESSING ? 'rgba(59, 130, 246, 0.1)' :
                               order.status === STATUS.WAITING_VALIDATION ? 'rgba(168, 85, 247, 0.1)' :
                               'rgba(34, 197, 94, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {getStatusLabel(order.status)}
                  </span>
                  {activeOrderId === order.id && <BiIcon name="check-circle-fill" size={16} style={{ color: 'var(--green-600)' }} />}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Details for selected order */}
      {selectedOrder && (
        <>
          <Card className="waiting-card">
            <div className="waiting-card__spinner">
              <Spinner size={48} />
            </div>
            <div className="waiting-card__title">
              {isAnalyzing ? 'Ordonnance envoyée' : 'Transcription en cours'}
            </div>
            <div className="waiting-card__text">
              Votre ordonnance est bien reçue par <strong>{pharmacy.name}</strong>.
              Le pharmacien est en train de retranscrire l'ordonnance{dots}
            </div>
            <div className="waiting-pill">
              <BiIcon name="hourglass-split" size={13} /> Traitement en cours
            </div>

            <div className="waiting-timestamps">
              <span><BiIcon name="clock-history" size={12} /> Envoyée à {formatClock(selectedOrder?.sentAt)}</span>
              <span><BiIcon name="arrow-repeat" size={12} /> Mise à jour {formatClock(selectedOrder?.updatedAt)}</span>
              <span><BiIcon name="stopwatch" size={12} /> {elapsedMinutes} min écoulées</span>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="list-check" />Suivi de progression</span>
            </div>
            <div className="waiting-progress">
              {waitingSteps.map(step => (
                <div key={step.id} className="waiting-progress__row">
                  <div className={["waiting-progress__dot", step.done ? 'is-done' : '', step.current ? 'is-current' : ''].filter(Boolean).join(' ')}>
                    {step.done ? '✓' : step.current ? <span className="waiting-progress__pulse" /> : ''}
                  </div>
                  <div className={["waiting-progress__label", step.done ? 'is-done' : '', step.current ? 'is-current' : ''].filter(Boolean).join(' ')}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="waiting-helper">
              <BiIcon name="info-circle" size={12} />
              Dès que la transcription est prête, vous passerez automatiquement à l'étape de validation.
            </div>
          </Card>

          {selectedOrder?.prescriptionPreview && (
            <Card>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="image" />Prévisualisation envoyée</span>
              </div>
              <div className="upload-preview-wrap" style={{ marginTop: 0 }}>
                <img src={selectedOrder.prescriptionPreview} alt="Ordonnance envoyée" className="upload-preview-img" />
              </div>
              <div className="upload-dropzone__subtitle" style={{ marginTop: '8px' }}>
                {selectedOrder.prescriptionFileName}
              </div>
            </Card>
          )}

          <Card>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="geo-alt" />Pharmacie sélectionnée</span>
            </div>
            <div className="info-grid">
              <div className="info-grid__row">
                <span className="info-grid__label">Nom</span>
                <span className="info-grid__value">{pharmacy.name}</span>
              </div>
              <div className="info-grid__row">
                <span className="info-grid__label">Zone</span>
                <span>{pharmacy.zone}</span>
              </div>
              <div className="info-grid__row">
                <span className="info-grid__label">Distance</span>
                <span>{pharmacy.dist}</span>
              </div>
              <div className="info-grid__row">
                <span className="info-grid__label">Délai estimé</span>
                <span className="info-grid__value" style={{ color: 'var(--green-600)' }}>10 – 20 minutes</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
