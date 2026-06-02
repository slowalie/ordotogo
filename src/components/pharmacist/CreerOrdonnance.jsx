import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Textarea, Select, Divider, Avatar, BiIcon } from '../shared/UI';
import { DRUG_DATABASE } from '../../data/mockData';
import { isUsablePrescriptionUrl, resolvePrescriptionPreviewUrl } from '../../services/supabaseApi';

function getDrugOptions(drugs) {
  if (!Array.isArray(drugs) || drugs.length === 0) {
    return DRUG_DATABASE.map(d => ({ value: d.id, label: `${d.name} — ${d.price.toLocaleString()} FCFA` }));
  }
  return drugs.map(d => ({ value: d.id, label: `${d.name} — ${d.price_xof.toLocaleString()} FCFA` }));
}

const defaultMed = () => ({ drugId: '', qty: '1', duree: '7j', posologie: '' });

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

export default function CreerOrdonnance({ alert, drugs = [], onSend, onBack }) {
  const [meds,    setMeds]    = useState([defaultMed()]);
  const [conseil, setConseil] = useState('');
  const [sending, setSending] = useState(false);
  const [resolvedPreview, setResolvedPreview] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendError, setSendError] = useState('');
  const drugOptions = useMemo(() => getDrugOptions(drugs), [drugs]);
  const fileKind = useMemo(() => getFileKind(alert, resolvedPreview), [alert, resolvedPreview]);
  const docViewerUrl = useMemo(() => getDocViewerUrl(resolvedPreview), [resolvedPreview]);

  useEffect(() => {
    let isMounted = true;
    let objectPreviewUrl = '';

    const resolvePreview = async () => {
      const nextPreview = await resolvePrescriptionPreviewUrl({
        filePath: alert?.prescriptionFilePath,
        previewUrl: alert?.prescriptionPreview,
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

    if (!alert) {
      setResolvedPreview('');
      return () => { isMounted = false; };
    }

    resolvePreview();

    return () => {
      isMounted = false;
      if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
    };
  }, [alert]);

  const addMed    = () => setMeds(m => [...m, defaultMed()]);
  const removeMed = (i) => setMeds(m => m.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) => setMeds(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med));

  const getDrugDatabase = () => drugs.length > 0 ? drugs : DRUG_DATABASE;

  const validMeds = meds.filter(m => m.drugId && m.qty);
  const total = validMeds.reduce((s, m) => {
    const db = getDrugDatabase();
    const drug = db.find(d => d.id === m.drugId);
    const price = drug ? (drugs.length > 0 ? drug.price_xof : drug.price) : 0;
    return s + (price * parseInt(m.qty || 1));
  }, 0);

  const handleSend = async () => {
    const db = getDrugDatabase();
    const medsPayload = validMeds.map((med, index) => {
      const drug = db.find(d => d.id === med.drugId);
      const qty = parseInt(med.qty || 1, 10);
      const price = drug ? (drugs.length > 0 ? drug.price_xof : drug.price) : 0;
      return {
        id: `${med.drugId}-${index + 1}`,
        drugId: med.drugId,
        name: drug?.name || 'Médicament',
        qty,
        duree: med.duree,
        posologie: med.posologie || `Durée: ${med.duree}`,
        price: price * qty,
      };
    });

    setSendError('');
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const isSent = await onSend({
        meds: medsPayload,
        conseil,
        total,
      });

      if (!isSent) {
        setSendError('Impossible d\'envoyer l\'ordonnance. Vérifiez la connexion à la base ou les droits Supabase.');
      }
    } catch (error) {
      setSendError(error?.message || 'Impossible d\'envoyer l\'ordonnance.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>

      {/* Patient info */}
      {alert && (
        <Card className="pharma-info-card">
          <div className="pharma-info-card__content">
            <Avatar name={alert.patientName} color="blue" size={40} />
            <div className="pharma-info-card__patient">
              <div className="pharma-info-card__name">{alert.patientName}</div>
              <div className="pharma-info-card__id">{alert.patientId}</div>
            </div>
            <div className="pharma-info-card__photo">
              {resolvedPreview ? (
                <button type="button" className="pharma-info-card__preview-trigger" title="Cliquer pour agrandir" onClick={() => setPreviewOpen(true)}>
                  {fileKind === 'image' ? (
                    <img src={resolvedPreview} alt="Ordonnance" className="pharma-info-card__preview" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: 'var(--gray-50)', color: 'var(--gray-700)' }}>
                      <div style={{ textAlign: 'center' }}>
                        <BiIcon name={fileKind === 'pdf' ? 'file-earmark-pdf' : 'file-earmark-word'} size={34} />
                        <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 600 }}>
                          {fileKind === 'pdf' ? 'Aperçu PDF' : 'Aperçu Word'}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              ) : (
                <div className="pharma-info-card__photo-box"><BiIcon name="clipboard" /></div>
              )}
              <div className="pharma-info-card__photo-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{alert.prescriptionFileName || 'Photo ordonnance'}</span>
                <Button size="sm" variant="ghost" onClick={() => setPreviewOpen(true)} style={{ marginLeft: 8 }}>Agrandir</Button>
                {resolvedPreview && (
                  <a href={resolvedPreview} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button size="sm" variant="ghost">Ouvrir le fichier</Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {previewOpen && (
        <PreviewModal
          title={alert?.prescriptionFileName || 'Ordonnance'}
          previewUrl={resolvedPreview}
          fileKind={fileKind}
          docViewerUrl={docViewerUrl}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Medications */}
      <Card>
        <div className="pharma-section-title">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="capsule-pill" />Médicaments dispensés</span>
        </div>

        <div className="pharma-med-list">
          {meds.map((med, i) => (
            <MedRow
              key={i}
              index={i}
              med={med}
              drugs={drugs}
              drugOptions={drugOptions}
              onUpdate={(f, v) => updateMed(i, f, v)}
              onRemove={() => removeMed(i)}
              canRemove={meds.length > 1}
            />
          ))}
        </div>

        <button
          onClick={addMed}
          className="pharma-add-button"
          onMouseEnter={e => { e.target.style.borderColor = 'var(--green-400)'; e.target.style.color = 'var(--green-600)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-text-secondary)'; }}
        >
          + Ajouter un médicament
        </button>
      </Card>

      {/* Pharmaceutical advice */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green-800)', marginBottom: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="chat-left-text" />Conseils pharmaceutiques</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
          Ces conseils seront affichés au patient avec chaque médicament.
        </div>
        <Textarea
          value={conseil}
          onChange={setConseil}
          placeholder="Ex : Prendre les antibiotiques à heures fixes. Éviter les produits laitiers dans l'heure suivant la prise. Bien terminer le traitement..."
          rows={4}
        />
      </Card>

      {/* Summary */}
      {validMeds.length > 0 && (
        <Card>
          <div className="pharma-summary-title">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="receipt" />Récapitulatif de l'ordonnance</span>
          </div>
          {validMeds.map((m, i) => {
            const db = getDrugDatabase();
            const drug = db.find(d => d.id === m.drugId);
            if (!drug) return null;
            const price = drugs.length > 0 ? drug.price_xof : drug.price;
            return (
              <div key={i} className="pharma-summary-row">
                <span style={{ color: 'var(--color-text-secondary)' }}>{drug.name} × {m.qty}</span>
                <span>{(price * parseInt(m.qty || 1)).toLocaleString()} FCFA</span>
              </div>
            );
          })}
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--green-800)' }}>
            <span>Total estimé</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
        </Card>
      )}

      {sendError && (
        <Card style={{ border: '1px solid var(--coral-200)', background: 'var(--coral-50)', color: 'var(--coral-700)', padding: '12px 16px' }}>
          {sendError}
        </Card>
      )}

      {/* Actions */}
      <div className="pharma-actions">
        <Button variant="ghost" onClick={onBack}>← Retour</Button>
        <Button
          fullWidth
          disabled={validMeds.length === 0 || sending}
          onClick={handleSend}
        >
          {sending ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="hourglass-split" />Envoi au patient...</span> : 'Envoyer l\'ordonnance au patient →'}
        </Button>
      </div>
    </div>
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

import ReactSelect from 'react-select'; // <-- 1. Ajoutez cet import en haut du fichier

// ... (le reste de votre code en haut)

function MedRow({ index, med, drugs = [], drugOptions, onUpdate, onRemove, canRemove }) {
  const getDrugDatabase = () => drugs.length > 0 ? drugs : DRUG_DATABASE;
  const db = getDrugDatabase();
  const drug = db.find(d => d.id === med.drugId);
  const price = drug ? (drugs.length > 0 ? drug.price_xof : drug.price) : 0;

  // 2. Trouver l'option sélectionnée pour que react-select affiche la bonne valeur
  const selectedOption = drugOptions.find(opt => opt.value === med.drugId) || null;

  return (
    <div className="pharma-med-card">
      <div className="pharma-med-card__head">
        <span className="pharma-med-card__title">
          Médicament {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="pharma-med-card__delete"
          >
            Supprimer
          </button>
        )}
      </div>

      {/* 3. LE NOUVEAU CHAMP UNIQUE : Recherche + Menu déroulant */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
          Rechercher et sélectionner un médicament
        </label>
        <ReactSelect
          options={drugOptions}
          value={selectedOption}
          onChange={(selected) => onUpdate('drugId', selected ? selected.value : '')}
          isSearchable={true}
          placeholder="Tapez le nom du médicament..."
          noOptionsMessage={() => "Aucun médicament trouvé"}
          styles={{
            control: (base) => ({
              ...base,
              borderColor: 'var(--color-border)',
              boxShadow: 'none',
              '&:hover': { borderColor: 'var(--green-400)' }
            })
          }}
        />
      </div>

      {drug && (
        <div style={{ fontSize: '11px', color: 'var(--green-600)', marginTop: '-8px', marginBottom: '12px', fontWeight: 600 }}>
          {drug.category} · {price.toLocaleString()} FCFA/unité
        </div>
      )}

      <div className="pharma-med-grid">
        <Input
          label="Quantité"
          value={med.qty}
          onChange={v => onUpdate('qty', v)}
          placeholder="Ex: 21"
          type="number"
        />
        <Input
          label="Durée"
          value={med.duree}
          onChange={v => onUpdate('duree', v)}
          placeholder="Ex: 7 jours"
        />
      </div>

      <div style={{ marginTop: '10px' }}>
        <Input
          label="Posologie détaillée"
          value={med.posologie}
          onChange={v => onUpdate('posologie', v)}
          placeholder="Ex: 1 gélule matin, midi et soir pendant les repas"
        />
      </div>
    </div>
  );
}