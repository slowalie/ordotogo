import { Card, Button, Divider } from '../shared/UI';
import { BiIcon } from '../shared/UI';

const MOCK_PRESCRIPTION = [
  { id: 'amox500', name: 'Amoxicilline 500mg',  dosage: '1 gélule 3×/jour pendant 7 jours', conseil: 'Prendre pendant les repas. Terminer le traitement même si vous vous sentez mieux.', price: 2800 },
  { id: 'para1g',  name: 'Paracétamol 1000mg',  dosage: '1 cp toutes les 6h si douleur',    conseil: 'Ne pas dépasser 4g/jour. Éviter l\'alcool.', price: 1200 },
  { id: 'omep20',  name: 'Oméprazole 20mg',     dosage: '1 gélule le matin à jeun',          conseil: 'À prendre 30 min avant le petit-déjeuner. Protège votre estomac durant le traitement antibiotique.', price: 2100 },
];

export default function ValidationOrdonnance({ accepted, onToggle, onConfirm }) {
  const acceptedMeds  = MOCK_PRESCRIPTION.filter(m => accepted[m.id] !== false);
  const total         = acceptedMeds.reduce((s, m) => s + m.price, 0);
  const hasAccepted   = acceptedMeds.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* Header notice */}
      <div className="validation-notice">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="check-circle-fill" /> <strong>Ordonnance numérique reçue</strong> — Le pharmacien a préparé vos médicaments. Acceptez ou refusez chaque produit.</span>
      </div>

      {/* Meds list */}
      <Card className="meds-card">
        <div className="meds-card__header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="capsule-pill" />Médicaments prescrits ({MOCK_PRESCRIPTION.length})</span>
        </div>
        {MOCK_PRESCRIPTION.map((med, i) => (
          <MedRow
            key={med.id}
            med={med}
            status={accepted[med.id] === false ? 'rejected' : 'accepted'}
            onToggle={() => onToggle(med.id)}
            last={i === MOCK_PRESCRIPTION.length - 1}
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
        {MOCK_PRESCRIPTION.filter(m => accepted[m.id] === false).map(m => (
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
            {med.dosage}
          </div>
          {accepted && (
            <div className="med-row__advice">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BiIcon name="chat-left-quote" size={12} />{med.conseil}</span>
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
