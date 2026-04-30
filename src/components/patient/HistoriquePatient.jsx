import { Card, Badge, EmptyState } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { MOCK_PATIENT_HISTORY } from '../../data/mockData';

export default function HistoriquePatient() {
  if (!MOCK_PATIENT_HISTORY.length) {
    return <EmptyState icon={<BiIcon name="clipboard" size={40} />} title="Aucune ordonnance" description="Vos ordonnances passées apparaîtront ici." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn .3s both' }}>
      {MOCK_PATIENT_HISTORY.map(ord => (
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
