import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button, BiIcon } from '../components/shared/UI';

const roles = [
  {
    id:    'patient',
    icon:  'hospital',
    label: 'Patient',
    desc:  'Envoyez vos ordonnances et suivez vos traitements',
  },
  {
    id:    'pharma',
    icon:  'capsule-pill',
    label: 'Pharmacien',
    desc:  'Gérez les prescriptions et préparez les commandes',
  },
];

export default function AuthPage() {
  const { login } = useApp();
  const [selected, setSelected] = useState(null);

  const LogoIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
    </svg>
  );

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        'var(--space-lg)',
      background:     'linear-gradient(160deg, var(--green-50) 0%, var(--gray-50) 60%)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{
          width:          '56px',
          height:         '56px',
          background:     'var(--green-600)',
          borderRadius:   '16px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 8px 24px rgba(15,110,86,.25)',
        }}>
          <LogoIcon />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--green-800)', lineHeight: 1 }}>
            OrdoTogo
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px', letterSpacing: '0.5px' }}>
            Prescription Digitale · Afrique
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background:   'white',
        borderRadius: 'var(--radius-xl)',
        border:       '1px solid var(--color-border)',
        padding:      '32px',
        width:        '100%',
        maxWidth:     '440px',
        boxShadow:    'var(--shadow-lg)',
        animation:    'slideUp 0.4s both',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--green-800)', marginBottom: '6px' }}>
          Bienvenue
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
          Sélectionnez votre profil pour accéder à votre espace.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          {roles.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              style={{
                padding:      '20px 16px',
                border:       `2px solid ${selected === r.id ? 'var(--green-600)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                background:   selected === r.id ? 'var(--green-50)' : 'white',
                cursor:       'pointer',
                textAlign:    'center',
                transition:   'all var(--transition)',
                fontFamily:   'var(--font-body)',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--green-600)' }}>
                <BiIcon name={r.icon} size={32} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-800)', marginBottom: '4px' }}>{r.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        <Button
          fullWidth
          disabled={!selected}
          onClick={() => login(selected)}
          size="lg"
        >
          Accéder à mon espace →
        </Button>

        {/* Trust indicators */}
        <div style={{
          display:       'flex',
          justifyContent:'center',
          gap:           '20px',
          marginTop:     '24px',
          paddingTop:    '20px',
          borderTop:     '1px solid var(--color-border)',
        }}>
          {[
            { icon: 'shield-lock', label: 'Sécurisé' },
            { icon: 'phone', label: 'Hors-ligne' },
            { icon: 'globe-africa', label: 'Afrique' },
          ].map(item => (
            <span key={item.label} style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BiIcon name={item.icon} size={12} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
        © 2025 OrdoTogo · Développé par ACACHA Elie & KINHOU Déo-gracias
      </p>
    </div>
  );
}
