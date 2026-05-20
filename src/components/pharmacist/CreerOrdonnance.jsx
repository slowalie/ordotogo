import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input, Textarea, Select, Divider, Avatar, BiIcon } from '../shared/UI';
import { DRUG_DATABASE } from '../../data/mockData';
import { createObjectUrlForPrescriptionPath, createSignedUrlsForPaths } from '../../services/supabaseApi';

async function openDocumentForOrder(alert, resolvedPreview) {
  try {
    if (resolvedPreview) {
      window.open(resolvedPreview, '_blank');
      return;
    }

    if (alert?.prescriptionFilePath) {
      const map = await createSignedUrlsForPaths([alert.prescriptionFilePath]);
      const url = map[alert.prescriptionFilePath];
      if (url) {
        window.open(url, '_blank');
        return;
      }

      const blobUrl = await createObjectUrlForPrescriptionPath(alert.prescriptionFilePath);
      if (blobUrl) {
        window.open(blobUrl, '_blank');
        return;
      }
    }

    if (isUsablePreviewUrl(alert?.prescriptionPreview)) {
      window.open(alert.prescriptionPreview, '_blank');
      return;
    }
  } catch (err) {
    console.error('openDocumentForOrder error', err);
  }
}

function getDrugOptions(drugs) {
  if (!Array.isArray(drugs) || drugs.length === 0) {
    return DRUG_DATABASE.map(d => ({ value: d.id, label: `${d.name} — ${d.price.toLocaleString()} FCFA` }));
  }
  return drugs.map(d => ({ value: d.id, label: `${d.name} — ${d.price_xof.toLocaleString()} FCFA` }));
}

const defaultMed = () => ({ drugId: '', qty: '1', duree: '7j', posologie: '' });

function isUsablePreviewUrl(url) {
  if (!url) return false;
  const value = String(url).trim();
  return value.startsWith('https://') || value.startsWith('http://') || value.startsWith('data:image/');
}

export default function CreerOrdonnance({ alert, drugs = [], onSend, onBack }) {
  const [meds,    setMeds]    = useState([defaultMed()]);
  const [conseil, setConseil] = useState('');
  const [sending, setSending] = useState(false);
  const [resolvedPreview, setResolvedPreview] = useState('');
  const [sendError, setSendError] = useState('');
  const drugOptions = useMemo(() => getDrugOptions(drugs), [drugs]);

  useEffect(() => {
    let isMounted = true;
    let objectPreviewUrl = '';

    const resolvePreview = async () => {
      if (!alert?.prescriptionFilePath) {
        setResolvedPreview(isUsablePreviewUrl(alert?.prescriptionPreview) ? alert.prescriptionPreview : '');
        return;
      }

      const map = await createSignedUrlsForPaths([alert.prescriptionFilePath]);
      if (!isMounted) return;
      const nextSigned = map[alert.prescriptionFilePath] || '';
      if (nextSigned) {
        setResolvedPreview(nextSigned);
        return;
      }

      if (isUsablePreviewUrl(alert?.prescriptionPreview)) {
        setResolvedPreview(alert.prescriptionPreview);
        return;
      }

      const objectUrl = await createObjectUrlForPrescriptionPath(alert.prescriptionFilePath);
      if (!isMounted) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return;
      }
      if (objectUrl) {
        if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
        objectPreviewUrl = objectUrl;
        setResolvedPreview(objectUrl);
        return;
      }

      setResolvedPreview('');
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
                <a href={resolvedPreview} target="_blank" rel="noreferrer" title="Ouvrir l'ordonnance">
                  <img src={resolvedPreview} alt="Ordonnance" className="pharma-info-card__preview" />
                </a>
              ) : (
                <div className="pharma-info-card__photo-box"><BiIcon name="clipboard" /></div>
              )}
              <div className="pharma-info-card__photo-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{alert.prescriptionFileName || 'Photo ordonnance'}</span>
                <button className="btn-link" onClick={() => openDocumentForOrder(alert, resolvedPreview)} style={{ marginLeft: 8 }}>Ouvrir</button>
              </div>
            </div>
          </div>
        </Card>
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

function MedRow({ index, med, drugs = [], drugOptions, onUpdate, onRemove, canRemove }) {
  const getDrugDatabase = () => drugs.length > 0 ? drugs : DRUG_DATABASE;
  const db = getDrugDatabase();
  const drug = db.find(d => d.id === med.drugId);
  const price = drug ? (drugs.length > 0 ? drug.price_xof : drug.price) : 0;

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

      {/* Drug select */}
      <Select
        label="Médicament"
        value={med.drugId}
        onChange={v => onUpdate('drugId', v)}
        options={drugOptions}
        placeholder="Sélectionner un médicament..."
      />

      {drug && (
        <div style={{ fontSize: '11px', color: 'var(--green-600)', marginTop: '4px', fontWeight: 600 }}>
          {drugs.length > 0 ? drug.category : drug.category} · {price.toLocaleString()} FCFA/unité
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
