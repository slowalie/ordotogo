import { Card, Badge, Button, EmptyState, Avatar } from '../shared/UI';
import { BiIcon } from '../shared/UI';

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 60000);
  if (diff < 1)  return 'À l\'instant';
  if (diff < 60) return `Il y a ${diff} min`;
  return `Il y a ${Math.floor(diff / 60)}h`;
}

export default function AlertesPharmacie({ alerts = [], onTreat }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn .3s both' }}>
      {/* New alerts */}
      <section>
        <div className="alerts-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="bell" />Nouvelles demandes ({alerts.length})</span>
        </div>
        {alerts.length === 0 ? (
          <EmptyState
            icon={<BiIcon name="clipboard-check" size={40} />}
            title="Aucune nouvelle ordonnance"
            description="Les demandes patients apparaîtront ici dès l'envoi."
          />
        ) : (
          <div className="alerts-list">
            {alerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onTreat={() => onTreat(alert)} />
            ))}
          </div>
        )}
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
        <Badge status="pending" custom="Nouvelle" />
      </div>

      {/* Photo preview */}
      <div className="alert-card__body">
        {alert.prescriptionPreview ? (
          <div className="alert-card__photo-preview">
            <img src={alert.prescriptionPreview} alt="Ordonnance patient" className="alert-card__photo-img" />
          </div>
        ) : (
          <div className="alert-card__photo">
            <BiIcon name="clipboard" size={32} />
            <div className="alert-card__photo-subtitle">
              Prévisualisation indisponible
            </div>
          </div>
        )}

        <div className="alert-card__photo-subtitle" style={{ marginBottom: '8px' }}>
          {alert.prescriptionFileName} · {Math.max(1, Math.round((alert.prescriptionFileSize || 0) / 1024))} Ko
        </div>

        {alert.conseil && (
          <div className="alert-card__note">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="chat-left-text" size={12} />{alert.conseil}</span>
          </div>
        )}

        <Button fullWidth onClick={onTreat}>
          Traiter cette ordonnance →
        </Button>
      </div>
    </Card>
  );
}
