import { useMemo } from 'react';
import { Card, Badge, Button, EmptyState, BiIcon } from '../shared/UI';
import { useApp } from '../../context/AppContext';
import { STATUS } from '../../data/mockData';

export default function PreparationOrdonnances() {
  const { prepOrders, markOrderReady } = useApp();

  const paidOrders = useMemo(
    () => prepOrders.filter(order => order.status === STATUS.PAID),
    [prepOrders]
  );

  const readyOrders = useMemo(
    () => prepOrders.filter(order => order.status === STATUS.READY),
    [prepOrders]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn .3s both' }}>
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
            <PrepCard key={order.id} order={order} onMarkReady={() => markOrderReady(order.id)} />
          ))
        )}
      </section>

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
            <Card key={order.id} style={{ border: '1px solid var(--green-100)', background: 'var(--green-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-800)' }}>{order.patientName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{order.id} - {(order.total || 0).toLocaleString()} FCFA</div>
                </div>
                <Badge status="ready" />
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}

function PrepCard({ order, onMarkReady }) {
  const meds = order.meds || [];

  return (
    <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{
        padding: '12px 16px',
        background: 'var(--blue-50)',
        borderBottom: '1px solid rgba(55,138,221,.15)',
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

        <Button fullWidth variant="success" onClick={onMarkReady}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check2-circle" />Marquer comme prete</span>
        </Button>
      </div>
    </Card>
  );
}
