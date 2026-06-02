import { Card, Button, Divider } from '../shared/UI';
import { BiIcon } from '../shared/UI';

export default function ValidationOrdonnance({ prescription = [], accepted, onToggle, onConfirm }) {
  const acceptedMeds  = prescription.filter(m => accepted[m.id] !== false);
  const total         = acceptedMeds.reduce((s, m) => s + m.price, 0);
  const hasAccepted   = acceptedMeds.length > 0;

  if (!prescription.length) {
    return (
      <Card>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Le pharmacien n'a pas encore finalisé la transcription.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* Header notice */}
      <div className="validation-notice">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check-circle-fill" /> <strong>Ordonnance numérique reçue</strong> — Le pharmacien a préparé vos médicaments. Acceptez ou refusez chaque produit.</span>
      </div>

      {/* Meds list */}
      <Card className="meds-card">
        <div className="meds-card__header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="capsule-pill" />Médicaments prescrits ({prescription.length})</span>
        </div>
        {prescription.map((med, i) => (
          <MedRow
            key={med.id}
            med={med}
            status={accepted[med.id] === false ? 'rejected' : 'accepted'}
            onToggle={() => onToggle(med.id)}
            last={i === prescription.length - 1}
          />
        ))}
      </Card>

      {/* Total */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="receipt" />Récapitulatif</span>
        </div>
        {acceptedMeds.map(m => (
          <div key={m.id} className="validation-summary">
            <span style={{ color: 'var(--color-text-secondary)' }}>{m.name}</span>
            <span>{m.price.toLocaleString()} FCFA</span>
          </div>
        ))}
        {prescription.filter(m => accepted[m.id] === false).map(m => (
          <div key={m.id} className="validation-summary is-muted">
            <span>{m.name}</span>
            <span>{m.price.toLocaleString()} FCFA</span>
          </div>
        ))}
        <Divider />
        <div className="validation-total">
          <span>Total</span>
          <span>{total.toLocaleString()} FCFA</span>
        </div>

        {hasAccepted ? (
          <Button fullWidth onClick={onConfirm} style={{ marginTop: '16px' }}>
            Confirmer et choisir le paiement →
          </Button>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--coral-600)' }}>
            Veuillez accepter au moins un médicament.
          </div>
        )}
      </Card>
    </div>
  );
}

function MedRow({ med, status, onToggle, last }) {
  const accepted = status === 'accepted';
  return (
    <div className={[
      'med-row',
      accepted ? 'is-accepted' : 'is-rejected',
    ].join(' ')} style={{ borderBottom: last ? 'none' : '1px solid var(--color-border)' }}>
      <div className="med-row__content">
        {/* Info */}
        <div className="med-row__info">
          <div className={accepted ? 'med-row__name' : 'med-row__name is-muted'}>
            {med.name}
          </div>
          <div className="med-row__dosage">
            {med.posologie || med.dosage || 'Posologie non renseignée'}
          </div>
          {accepted && (
            <div className="med-row__advice">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="chat-left-quote" size={12} />Qté: {med.qty}</span>
            </div>
          )}
        </div>

        {/* Price + toggle */}
        <div className="med-row__actions">
          <div className="med-row__price">
            {med.price.toLocaleString()} FCFA
          </div>
          <div className="med-row__toggles">
            <button onClick={() => !accepted && onToggle()} className={accepted ? 'med-toggle is-accepting' : 'med-toggle'}>✓</button>
            <button onClick={() => accepted && onToggle()} className={!accepted ? 'med-toggle is-rejecting' : 'med-toggle'}>✗</button>
          </div>
        </div>
      </div>
    </div>
  );
}
