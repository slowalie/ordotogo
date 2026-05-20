import { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button, EmptyState, Avatar } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { isUsablePrescriptionUrl, resolvePrescriptionPreviewUrl } from '../../services/supabaseApi';

function isPdfPreview(alert, resolvedPreview) {
  const source = `${alert?.prescriptionFileName || ''} ${alert?.prescriptionFilePath || ''} ${resolvedPreview || ''}`;
  return /\.pdf(?:$|[?#])/i.test(source);
}

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
  const [resolvedPreview, setResolvedPreview] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewIsPdf = useMemo(() => isPdfPreview(alert, resolvedPreview), [alert, resolvedPreview]);

  useEffect(() => {
    let isMounted = true;
    let refreshInterval = null;
    let objectPreviewUrl = '';

    const refreshSignedUrl = async () => {
      const nextPreview = await resolvePrescriptionPreviewUrl({
        filePath: alert.prescriptionFilePath,
        previewUrl: alert.prescriptionPreview,
      });

      if (!isMounted) {
        if (nextPreview && nextPreview.startsWith('blob:')) URL.revokeObjectURL(nextPreview);
        return;
      }

      if (nextPreview && nextPreview.startsWith('blob:')) {
        if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        objectPreviewUrl = nextPreview;
      }

      setResolvedPreview(nextPreview);
    };

    if (!alert.prescriptionFilePath) {
      setResolvedPreview(isUsablePrescriptionUrl(alert.prescriptionPreview) ? alert.prescriptionPreview : '');
      return () => { isMounted = false; };
    }

    // Générer l'URL signée immédiatement
    refreshSignedUrl();

    // Régénérer toutes les 50 minutes (avant expiration à 60 minutes)
    refreshInterval = setInterval(() => {
      refreshSignedUrl();
    }, 50 * 60 * 1000);

    return () => {
      isMounted = false;
      if (refreshInterval) clearInterval(refreshInterval);
      if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
    };
  }, [alert.prescriptionPreview, alert.prescriptionFilePath]);

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
        {resolvedPreview ? (
          <button
            type="button"
            className="alert-card__photo-preview"
            title="Cliquer pour agrandir"
            onClick={() => setPreviewOpen(true)}
          >
            <img src={resolvedPreview} alt="Ordonnance patient" className="alert-card__photo-img" />
          </button>
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            Agrandir
          </Button>
          <Button fullWidth onClick={onTreat}>
            Traiter cette ordonnance →
          </Button>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal
          title={alert.prescriptionFileName || 'Ordonnance'}
          previewUrl={resolvedPreview}
          isPdf={previewIsPdf}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </Card>
  );
}

function PreviewModal({ title, previewUrl, isPdf, onClose }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="preview-modal__overlay" role="presentation" onClick={onClose}>
      <div className="preview-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="preview-modal__header">
          <div>
            <div className="preview-modal__title">{title}</div>
            <div className="preview-modal__subtitle">Prévisualisation agrandie</div>
          </div>
          <button type="button" className="btn-outline" onClick={onClose}>Fermer</button>
        </div>
        <div className="preview-modal__body">
          {previewUrl ? (
            isPdf ? (
              <iframe className="preview-modal__frame" src={previewUrl} title={title} />
            ) : (
              <img className="preview-modal__image" src={previewUrl} alt={title} />
            )
          ) : (
            <div className="preview-modal__empty">Prévisualisation indisponible</div>
          )}
        </div>
        {previewUrl && (
          <div className="preview-modal__footer">
            <a className="btn-outline" href={previewUrl} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet</a>
          </div>
        )}
      </div>
    </div>
  );
}
