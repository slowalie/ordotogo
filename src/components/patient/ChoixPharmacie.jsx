import { useState } from 'react';
import { Card, Badge, Button, SectionHeader, BiIcon } from '../shared/UI';
import { PHARMACIES } from '../../data/mockData';

export default function ChoixPharmacie({ selected, onSelect, onSend, onBack }) {
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onSend();
    }, 1400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green-800)', marginBottom: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="shop" />Choisir une pharmacie</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Sélectionnez la pharmacie qui préparera votre ordonnance.
        </div>

        <SectionHeader>Pharmacies à proximité</SectionHeader>
        <div className="pharmacy-list">
          {PHARMACIES.map(ph => (
            <PharmacyItem
              key={ph.id}
              pharmacy={ph}
              isSelected={selected === ph.id}
              onSelect={() => ph.open && onSelect(ph.id)}
            />
          ))}
        </div>
      </Card>

      {selected && (
        <div style={{ display: 'flex', gap: '10px', animation: 'slideUp .2s both' }}>
          <Button variant="ghost" onClick={onBack}>← Retour</Button>
          <Button fullWidth onClick={handleSend} disabled={sending}>
            {sending ? 'Envoi en cours...' : 'Envoyer l\'ordonnance →'}
          </Button>
        </div>
      )}
    </div>
  );
}

function PharmacyItem({ pharmacy, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => pharmacy.open && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'pharmacy-item',
        isSelected ? 'is-selected' : '',
        hovered ? 'is-hovered' : '',
        pharmacy.open ? '' : 'is-closed',
      ].filter(Boolean).join(' ')}
    >
      {/* Icon */}
      <div className={[
        'pharmacy-item__icon',
        isSelected ? 'is-selected' : '',
      ].filter(Boolean).join(' ')}>
        <BiIcon name="shop" size={18} />
      </div>

      {/* Info */}
      <div className="pharmacy-item__info">
        <div className="pharmacy-item__name">{pharmacy.name}</div>
        <div className="pharmacy-item__meta">
          {pharmacy.zone} · {pharmacy.dist}
        </div>
      </div>

      {/* Status + check */}
      <div className="pharmacy-item__status">
        <Badge status={pharmacy.open ? 'open' : 'closed'} />
        <div className={['pharmacy-item__check', isSelected ? 'is-selected' : ''].filter(Boolean).join(' ')}>
          {isSelected && <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>✓</span>}
        </div>
      </div>
    </div>
  );
}
