import { useState, useMemo } from 'react';
import { Card, Badge, EmptyState, Input, Select, BiIcon } from '../shared/UI'; // Ajout de Input et Select
import { useApp } from '../../context/AppContext';
import { STATUS } from '../../data/mockData';

function formatHistoryDate(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function HistoriquePharmacie() {
  const { patientOrders } = useApp();
  
  // Nouveaux états pour la recherche et le filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const deliveredOrders = patientOrders
    .filter(order => order.status === STATUS.DELIVERED)
    .sort((a, b) => new Date(b.deliveredAt || b.updatedAt || b.sentAt) - new Date(a.deliveredAt || a.updatedAt || a.sentAt));

  const baseHistory = deliveredOrders.length > 0
    ? deliveredOrders.map(order => ({
        id: order.id,
        patient: order.patientName || 'Inconnu',
        date: formatHistoryDate(order.deliveredAt || order.updatedAt || order.sentAt),
        method: order.paymentMethod || 'Pharmacie',
        total: order.total || 0,
        meds: (order.meds || []).map(med => `${med.name} × ${med.qty || 1}`),
      }))
    : [];

  // Filtrage dynamique basé sur la recherche et le mode de paiement
  const filteredHistory = useMemo(() => {
    return baseHistory.filter(order => {
      // 1. Filtre par méthode de paiement
      if (paymentFilter !== 'all' && order.method !== paymentFilter) {
        return false;
      }
      
      // 2. Filtre par texte (recherche patient ou médicament)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchPatient = order.patient.toLowerCase().includes(term);
        const matchMeds = order.meds.some(med => med.toLowerCase().includes(term));
        
        if (!matchPatient && !matchMeds) {
          return false;
        }
      }
      
      return true;
    });
  }, [baseHistory, searchTerm, paymentFilter]);

  if (!baseHistory.length) {
    return <EmptyState icon={<BiIcon name="clipboard" size={40} />} title="Aucun historique" description="Les ordonnances délivrées apparaîtront ici." />;
  }

  // Les statistiques se mettent à jour en fonction des éléments filtrés !
  const totalRevenue = filteredHistory.reduce((sum, order) => sum + order.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      
      {/* Statistiques (Dynamiques) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Ce mois', value: filteredHistory.length, unit: 'ordonnances', color: 'var(--green-50)', text: 'var(--green-800)' },
          { label: 'Revenus', value: totalRevenue.toLocaleString(), unit: 'FCFA', color: 'var(--blue-50)', text: 'var(--blue-800)' },
          { label: 'Mixx Pay', value: filteredHistory.filter(order => order.method === 'Mixx').length, unit: 'paiements', color: 'var(--amber-50)', text: 'var(--amber-600)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: stat.color,
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: stat.text }}>{stat.value}</div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{stat.unit}</div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Contrôles de Recherche et de Filtre */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', marginTop: '8px' }}>
        <Input 
          placeholder="Rechercher un patient ou médicament..." 
          value={searchTerm}
          onChange={setSearchTerm}
        />
        
        
      </div>

      {/* Liste de l'historique */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map(order => (
            <Card key={order.id} hover style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '10px 16px',
                background: 'var(--gray-50)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{order.patient}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {order.date} · {order.method === 'Mixx'
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="phone" size={12} />Mixx</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="shop" size={12} />Pharmacie</span>}
                  </div>
                </div>
                <Badge status="delivered" />
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {order.meds.join(' · ')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-700)', flexShrink: 0, marginLeft: '12px' }}>
                  {order.total.toLocaleString()} FCFA
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-text-muted)', fontSize: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
            Aucun résultat pour cette recherche.
          </div>
        )}
      </div>
      
    </div>
  );
}