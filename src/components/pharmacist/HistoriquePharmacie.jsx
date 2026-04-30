import { Card, Badge, EmptyState } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { MOCK_PHARMA_HISTORY } from '../../data/mockData';

export default function HistoriquePharmacie() {
  if (!MOCK_PHARMA_HISTORY.length) {
    return <EmptyState icon={<BiIcon name="clipboard" size={40} />} title="Aucun historique" description="Les ordonnances délivrées apparaîtront ici." />;
  }

  const totalRevenue = MOCK_PHARMA_HISTORY.reduce((s, o) => s + o.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Ce mois', value: MOCK_PHARMA_HISTORY.length, unit: 'ordonnances', color: 'var(--green-50)', text: 'var(--green-800)' },
          { label: 'Revenus', value: totalRevenue.toLocaleString(), unit: 'FCFA', color: 'var(--blue-50)', text: 'var(--blue-800)' },
          { label: 'Mixx Pay', value: MOCK_PHARMA_HISTORY.filter(o => o.method === 'Mixx').length, unit: 'paiements', color: 'var(--amber-50)', text: 'var(--amber-600)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background:   stat.color,
            borderRadius: 'var(--radius-md)',
            padding:      '12px',
            textAlign:    'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: stat.text }}>{stat.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{stat.unit}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MOCK_PHARMA_HISTORY.map(ord => (
          <Card key={ord.id} hover style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding:    '10px 16px',
              background: 'var(--gray-50)',
              borderBottom: '1px solid var(--color-border)',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{ord.patient}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {ord.date} · {ord.method === 'Mixx' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="phone" size={12} />Mixx</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="shop" size={12} />Pharmacie</span>}
                </div>
              </div>
              <Badge status="delivered" />
            </div>
            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {ord.meds.join(' · ')}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-700)', flexShrink: 0, marginLeft: '12px' }}>
                {ord.total.toLocaleString()} FCFA
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
