import { Card, Badge, EmptyState } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { useApp } from '../../context/AppContext';
import { MOCK_PATIENT_HISTORY, STATUS } from '../../data/mockData';

function formatHistoryDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoriquePatient() {
  const { patientOrders } = useApp();

  const deliveredOrders = patientOrders
    .filter(order => order.status === STATUS.DELIVERED)
    .sort((a, b) => new Date(b.deliveredAt || b.updatedAt || b.sentAt) - new Date(a.deliveredAt || a.updatedAt || a.sentAt));

  const history = deliveredOrders.length > 0
    ? deliveredOrders.map(order => ({
        id: order.id,
        pharmacy: order.pharmacyName,
        date: formatHistoryDate(order.deliveredAt || order.updatedAt || order.sentAt),
        status: order.status,
        total: order.total || 0,
        meds: (order.meds || []).map(med => med.name),
      }))
    : MOCK_PATIENT_HISTORY;

  if (!history.length) {
    return <EmptyState icon={<BiIcon name="clipboard" size={40} />} title="Aucune ordonnance" description="Vos ordonnances passées apparaîtront ici." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn .3s both' }}>
      {history.map(ord => (
        <Card key={ord.id} hover style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding:    '10px 16px',
            background: 'var(--gray-50)',
            borderBottom:'1px solid var(--color-border)',
            display:    'flex',
            alignItems: 'center',
            justifyContent:'space-between',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-800)' }}>{ord.pharmacy}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{ord.date}</div>
            </div>
            <Badge status={ord.status} />
          </div>

          {/* Body */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              {ord.meds.join(' · ')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{ord.id}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-700)' }}>
                {ord.total.toLocaleString()} FCFA
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
