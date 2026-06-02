import { useEffect, useMemo, useState } from 'react';
import { Card, Badge, Button, EmptyState, Avatar } from '../shared/UI';
import { BiIcon } from '../shared/UI';
import { isUsablePrescriptionUrl, resolvePrescriptionPreviewUrl } from '../../services/supabaseApi';

function getFileKind(alert, resolvedPreview) {
  const source = `${alert?.prescriptionFileName || ''} ${alert?.prescriptionFilePath || ''} ${resolvedPreview || ''}`;
  if (/\.pdf(?:$|[?#])/i.test(source)) return 'pdf';
  if (/\.docx?(?:$|[?#])/i.test(source)) return 'doc';
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(?:$|[?#])/i.test(source) || /^data:image\//i.test(source) || /^blob:/i.test(resolvedPreview || '')) return 'image';
  return 'unknown';
}

function getDocViewerUrl(previewUrl) {
  if (!previewUrl) return '';
  if (String(previewUrl).startsWith('blob:') || String(previewUrl).startsWith('data:')) return '';
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
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
  const fileKind = useMemo(() => getFileKind(alert, resolvedPreview), [alert, resolvedPreview]);
  const docViewerUrl = useMemo(() => getDocViewerUrl(resolvedPreview), [resolvedPreview]);

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
          fileKind === 'image' ? (
            <button
              type="button"
              className="alert-card__photo-preview"
              title="Cliquer pour agrandir"
              onClick={() => setPreviewOpen(true)}
            >
              <img src={resolvedPreview} alt="Ordonnance patient" className="alert-card__photo-img" />
            </button>
          ) : (
            <button
              type="button"
              className="alert-card__photo-preview"
              title="Ouvrir l'aperçu"
              onClick={() => setPreviewOpen(true)}
              style={{ background: 'var(--gray-50)', border: '1px dashed var(--gray-300)' }}
            >
              <div style={{ textAlign: 'center', color: 'var(--gray-700)' }}>
                <BiIcon name={fileKind === 'pdf' ? 'file-earmark-pdf' : 'file-earmark-word'} size={36} />
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>
                  {fileKind === 'pdf' ? 'Document PDF' : 'Document Word'}
                </div>
              </div>
            </button>
          )
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
            Aperçu
          </Button>
          {resolvedPreview && (
            <a href={resolvedPreview} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm">
                Ouvrir le fichier
              </Button>
            </a>
          )}
          <Button fullWidth onClick={onTreat}>
            Traiter cette ordonnance →
          </Button>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal
          title={alert.prescriptionFileName || 'Ordonnance'}
          previewUrl={resolvedPreview}
          fileKind={fileKind}
          docViewerUrl={docViewerUrl}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </Card>
  );
}

function PreviewModal({ title, previewUrl, fileKind, docViewerUrl, onClose }) {
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
            fileKind === 'pdf' ? (
              <iframe className="preview-modal__frame" src={previewUrl} title={title} />
            ) : fileKind === 'doc' && docViewerUrl ? (
              <iframe className="preview-modal__frame" src={docViewerUrl} title={title} />
            ) : fileKind === 'image' ? (
              <img className="preview-modal__image" src={previewUrl} alt={title} />
            ) : (
              <div className="preview-modal__empty">
                Prévisualisation non disponible pour ce format.<br />Utilisez "Ouvrir dans un nouvel onglet".
              </div>
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
