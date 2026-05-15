import { Card, Button, BiIcon } from '../shared/UI';

export default function ConfirmationPaiement({ method, order, onReset }) {
  const pharmacyName = order?.pharmacyName || 'la pharmacie choisie';
  const ordCode = order?.pickupCode || '';
  const isMixx   = method === 'mixx';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideUp .4s both' }}>
      <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>
          <BiIcon name={isMixx ? 'check-circle-fill' : 'shop'} size={56} />
        </div>
        <div style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '24px',
          color:         'var(--green-800)',
          marginBottom:  '10px',
        }}>
          {isMixx ? 'Paiement confirmé !' : 'Commande validée !'}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.7 }}>
          {isMixx
            ? `Votre ordonnance est en cours de préparation à ${pharmacyName}. Présentez le QR code ci-dessous lors du retrait.`
            : `Rendez-vous à ${pharmacyName} pour récupérer et régler vos médicaments.`}
        </div>

        {ordCode ? (
          <div style={{
            display:        'inline-block',
            background:     'var(--gray-50)',
            border:         '1px solid var(--color-border)',
            borderRadius:   'var(--radius-md)',
            padding:        '20px 32px',
            marginBottom:   '12px',
          }}>
            <div style={{
              fontFamily:    'monospace',
              fontSize:      '22px',
              fontWeight:    700,
              color:         'var(--green-800)',
              letterSpacing: '4px',
            }}>
              {ordCode}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Code à présenter en pharmacie
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            Le code de retrait sera généré quand la pharmacie finalisera la préparation.
          </div>
        )}
      </Card>

      {/* Steps */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name={isMixx ? 'box-seam' : 'shop'} />{isMixx ? 'Récupérer ma commande' : 'Se rendre en pharmacie'}</span>
        </div>
        {(isMixx
          ? ['Le pharmacien prépare vos médicaments', 'Vous recevrez une notification quand c\'est prêt', ordCode ? `Présentez le code ${ordCode} à la pharmacie` : 'Récupérez le code quand la préparation est terminée']
          : [`Rendez-vous à ${pharmacyName}`, ordCode ? 'Présentez ce code au pharmacien' : 'Présentez le message de confirmation au pharmacien', 'Récupérez et réglez vos médicaments sur place']
        ).map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width:          '20px', height: '20px',
              borderRadius:   '50%',
              background:     'var(--green-600)',
              color:          'white',
              fontSize:       '11px',
              fontWeight:     700,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
              marginTop:      '1px',
            }}>{i + 1}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{step}</div>
          </div>
        ))}
      </Card>

      <Button variant="ghost" onClick={onReset} fullWidth>
        Envoyer une nouvelle ordonnance
      </Button>
    </div>
  );
}
