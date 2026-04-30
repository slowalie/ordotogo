import { Card, Badge, Button, EmptyState, Avatar } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { MOCK_ALERTS, MOCK_PHARMA_HISTORY } from '../../data/mockData';

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (diff < 1)  return 'À l\'instant';
  if (diff < 60) return `Il y a ${diff} min`;
  return `Il y a ${Math.floor(diff / 60)}h`;
}

export default function AlertesPharmacie({ onTreat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn .3s both' }}>
      {/* New alerts */}
      <section>
        <div className="alerts-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="bell" />Nouvelles demandes ({MOCK_ALERTS.length})</span>
        </div>
        <div className="alerts-list">
          {MOCK_ALERTS.map(alert => (
            <AlertCard key={alert.id} alert={alert} onTreat={() => onTreat(alert)} />
          ))}
        </div>
      </section>

      {/* In progress */}
      <section>
        <div className="alerts-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="flask" />Ordonnances prêtes (1)</span>
        </div>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ready-card__header">
            <div>
              <div className="ready-card__title">Yawa Abla</div>
              <div className="ready-card__meta">Hier 14h30 · Mixx confirmé</div>
            </div>
            <Badge status="ready" />
          </div>
          <div className="ready-card__body">
            <div className="ready-card__meds">Amoxicilline · Paracétamol · Oméprazole</div>
            <div className="ready-card__price">6 100 FCFA</div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function AlertCard({ alert, onTreat }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--blue-50)' }}>
      {/* Header */}
          <div className="alert-card__header">
        <Avatar name={alert.patientName} color="blue" size={32} />
        <div className="alert-card__patient">
          <div className="alert-card__patient-name">{alert.patientName}</div>
          <div className="alert-card__patient-meta">{alert.patientId} · {timeAgo(alert.sentAt)}</div>
        </div>
        <Badge status="new" />
      </div>

      {/* Photo preview */}
      <div className="alert-card__body">
        <div className="alert-card__photo">
          <BiIcon name="clipboard" size={32} />
          <div className="alert-card__photo-subtitle">
            ordonnance_photo.jpg · 2.1 Mo
          </div>
        </div>

        {alert.note && (
          <div className="alert-card__note">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="chat-left-text" size={12} />{alert.note}</span>
          </div>
        )}

        <Button fullWidth onClick={onTreat}>
          Traiter cette ordonnance →
        </Button>
      </div>
    </Card>
  );
}
