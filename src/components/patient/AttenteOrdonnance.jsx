import { useEffect, useState } from 'react';
import { Card, Spinner, BiIcon } from '../shared/UI';
import { PHARMACIES } from '../../data/mockData';

export default function AttenteOrdonnance({ pharmacyId, onReceived }) {
  const [dots, setDots] = useState('');
  const pharmacy = PHARMACIES.find(p => p.id === pharmacyId) || PHARMACIES[0];

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {/* Status card */}
      <Card className="waiting-card">
        <div className="waiting-card__spinner">
          <Spinner size={48} />
        </div>
        <div className="waiting-card__title">
          Ordonnance envoyée !
        </div>
        <div className="waiting-card__text">
          Votre ordonnance a bien été transmise à <strong>{pharmacy.name}</strong>.
          Le pharmacien prépare votre ordonnance numérique{dots}
        </div>
        <div className="waiting-pill">
          <BiIcon name="hourglass-split" size={13} /> En cours de traitement
        </div>
      </Card>

      {/* Pharmacy info */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="geo-alt" />Pharmacie sélectionnée</span>
        </div>
        <div className="info-grid">
          <div className="info-grid__row">
            <span className="info-grid__label">Nom</span>
            <span className="info-grid__value">{pharmacy.name}</span>
          </div>
          <div className="info-grid__row">
            <span className="info-grid__label">Zone</span>
            <span>{pharmacy.zone}</span>
          </div>
          <div className="info-grid__row">
            <span className="info-grid__label">Distance</span>
            <span>{pharmacy.dist}</span>
          </div>
          <div className="info-grid__row">
            <span className="info-grid__label">Délai estimé</span>
            <span className="info-grid__value" style={{ color: 'var(--green-600)' }}>10 – 20 minutes</span>
          </div>
        </div>
      </Card>

      {/* Demo trigger */}
      <div className="demo-banner">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="lightbulb" /><strong>Mode démo</strong> — Simuler la réponse du pharmacien</span>
        <button
          onClick={onReceived}
          className="demo-banner__button"
          style={{
            padding:      '5px 12px',
            background:   'var(--blue-600)',
            color:        'white',
            border:       'none',
            borderRadius: 'var(--radius-sm)',
            fontSize:     '12px',
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'var(--font-body)',
            flexShrink:   0,
          }}
        >
          <BiIcon name="lightning-charge-fill" /> Simuler
        </button>
      </div>
    </div>
  );
}
