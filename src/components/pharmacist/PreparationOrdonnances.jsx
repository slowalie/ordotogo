import { useState } from 'react';
import { Card, Badge, Button, EmptyState, BiIcon } from '../shared/UI';

const PREP_ORDERS = [
  {
    id:        'ORD-2025-051',
    patient:   'Yawa Abla',
    patientId: 'PAT-003',
    method:    'mixx',
    total:     6100,
    paidAt:    '2025-04-29T07:15:00',
    meds: [
      { name: 'Amoxicilline 500mg', qty: 21, done: false },
      { name: 'Paracétamol 1000mg', qty: 12, done: false },
      { name: 'Oméprazole 20mg',    qty: 14, done: false },
    ],
    steps: [
      { label: 'Prélever les médicaments en stock', done: false },
      { label: 'Vérifier les interactions médicamenteuses', done: false },
      { label: 'Préparer l\'emballage et l\'étiquetage', done: false },
      { label: 'Contrôle qualité final', done: false },
      { label: 'Mise de côté pour retrait patient', done: false },
    ],
  },
];

export default function PreparationOrdonnances() {
  const [orders, setOrders] = useState(PREP_ORDERS);
  const [readyOrders, setReadyOrders] = useState([]);

  const toggleStep = (orderId, stepIdx) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      const steps = ord.steps.map((s, i) => i === stepIdx ? { ...s, done: !s.done } : s);
      return { ...ord, steps };
    }));
  };

  const toggleMed = (orderId, medIdx) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id !== orderId) return ord;
      const meds = ord.meds.map((m, i) => i === medIdx ? { ...m, done: !m.done } : m);
      return { ...ord, meds };
    }));
  };

  const markReady = (orderId) => {
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      setReadyOrders(prev => [...prev, ord]);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn .3s both' }}>

      {/* À préparer */}
      <section>
        <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="flask" />À préparer ({orders.length})</span>
        </div>

        {orders.length === 0 ? (
          <EmptyState icon={<BiIcon name="check2-circle" size={40} />} title="Tout est préparé !" description="Aucune ordonnance en attente de préparation." />
        ) : (
          orders.map(ord => (
            <PrepCard
              key={ord.id}
              order={ord}
              onToggleStep={(i) => toggleStep(ord.id, i)}
              onToggleMed={(i) => toggleMed(ord.id, i)}
              onMarkReady={() => markReady(ord.id)}
            />
          ))
        )}
      </section>

      {/* Prêtes */}
      <section>
        <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check2-circle" />Ordonnances prêtes ({readyOrders.length})</span>
        </div>

        {readyOrders.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '12px 0' }}>
            Les ordonnances marquées comme prêtes apparaîtront ici.
          </div>
        ) : (
          readyOrders.map(ord => (
            <Card key={ord.id} style={{ border: '1px solid var(--green-100)', background: 'var(--green-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-800)' }}>{ord.patient}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{ord.id} · {ord.total.toLocaleString()} FCFA</div>
                </div>
                <Badge status="ready" />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--green-700)', marginTop: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="check2-circle" size={12} />Le patient a été notifié. En attente de récupération.</span>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

function PrepCard({ order, onToggleStep, onToggleMed, onMarkReady }) {
  const allStepsDone = order.steps.every(s => s.done);
  const allMedsDone  = order.meds.every(m => m.done);
  const canMarkReady = allStepsDone && allMedsDone;
  const progress     = Math.round((order.steps.filter(s => s.done).length / order.steps.length) * 100);

  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
      {/* Header */}
      <div style={{
        padding:    '12px 16px',
        background: 'var(--blue-50)',
        borderBottom: '1px solid rgba(55,138,221,.15)',
        display:    'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blue-800)' }}>{order.patient}</div>
          <div style={{ fontSize: '12px', color: 'var(--blue-600)' }}>
            {order.id} · {order.method === 'mixx' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="phone" size={12} />Mixx payé</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="shop" size={12} />Paiement en pharmacie</span>} · {order.total.toLocaleString()} FCFA
          </div>
        </div>
        <Badge status="processing" />
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            <span>Progression</span>
            <span style={{ fontWeight: 600, color: 'var(--green-600)' }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--gray-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{
              height:     '100%',
              width:      `${progress}%`,
              background: progress === 100 ? 'var(--green-400)' : 'var(--green-600)',
              borderRadius: 'var(--radius-full)',
              transition: 'width var(--transition-slow)',
            }} />
          </div>
        </div>

        {/* Meds checklist */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Médicaments
          </div>
          {order.meds.map((med, i) => (
            <CheckRow
              key={i}
              label={`${med.name} × ${med.qty}`}
              done={med.done}
              onToggle={() => onToggleMed(i)}
            />
          ))}
        </div>

        {/* Steps checklist */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Étapes de préparation
          </div>
          {order.steps.map((step, i) => (
            <CheckRow
              key={i}
              label={step.label}
              done={step.done}
              onToggle={() => onToggleStep(i)}
            />
          ))}
        </div>

        <Button
          fullWidth
          disabled={!canMarkReady}
          variant={canMarkReady ? 'success' : 'ghost'}
          onClick={onMarkReady}
        >
          {canMarkReady ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check2-circle" />Marquer comme prête →</span> : `Complétez toutes les étapes (${progress}%)`}
        </Button>
      </div>
    </Card>
  );
}

function CheckRow({ label, done, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        padding:    '7px 0',
        cursor:     'pointer',
        borderBottom: '1px solid var(--gray-50)',
      }}
    >
      <div style={{
        width:          '20px',
        height:         '20px',
        borderRadius:   '50%',
        border:         `2px solid ${done ? 'var(--green-400)' : 'var(--color-border)'}`,
        background:     done ? 'var(--green-400)' : 'white',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        transition:     'all var(--transition)',
      }}>
        {done && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{
        fontSize:       '13px',
        color:          done ? 'var(--color-text-muted)' : 'var(--color-text)',
        textDecoration: done ? 'line-through' : 'none',
        transition:     'all var(--transition)',
      }}>
        {label}
      </span>
    </div>
  );
}
