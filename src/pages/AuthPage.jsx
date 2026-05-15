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

const stats = [
  { value: '3x', label: 'Types d’utilisateurs' },
  { value: '100%', label: 'Traçabilité' },
  { value: '0', label: 'Fraude possible' },
];

const actorCards = [
  {
    id: 'patient',
    role: 'Rôle 1',
    title: 'Le Patient',
    imageTone: 'linear-gradient(135deg, rgba(27, 94, 77, 0.35) 0%, rgba(14, 34, 79, 0.55) 100%)',
    features: [
      'Réception par SMS ou WhatsApp',
      'Consultation de l’historique médical',
      'Affichage du QR Code personnel',
      'Accès sans compte obligatoire',
    ],
  },
  {
    id: 'pharma',
    role: 'Rôle 2',
    title: 'Le Pharmacien',
    imageTone: 'linear-gradient(135deg, rgba(8, 47, 73, 0.32) 0%, rgba(7, 115, 99, 0.55) 100%)',
    features: [
      'Scanner de QR Code intégré',
      'Vérification instantanée d’authenticité',
      'Validation et marquage « délivrée »',
      'Historique des dispensations',
    ],
  },
  {
    id: 'doctor',
    role: 'Rôle 3',
    title: 'Le Médecin',
    imageTone: 'linear-gradient(135deg, rgba(13, 27, 87, 0.42) 0%, rgba(25, 45, 113, 0.65) 100%)',
    features: [
      'Rédaction rapide de l’ordonnance numérique',
      'Signature électronique certifiée',
      'Gestion des patients et historique',
      'Tableau de bord et statistiques',
    ],
    comingSoon: true,
  },
];

const features = [
  {
    icon: 'file-earmark-text',
    title: 'Prescription digitale',
    desc: 'Formulaire guidé avec base de médicaments intégrée.',
  },
  {
    icon: 'qr-code-scan',
    title: 'QR Code unique',
    desc: 'Chaque ordonnance génère un code infalsifiable à usage unique.',
  },
  {
    icon: 'shield-lock',
    title: 'Signature électronique',
    desc: 'Signature cryptographique certifiée du médecin prescripteur.',
  },
  {
    icon: 'phone',
    title: 'Mode hors-ligne',
    desc: 'Interface légère fonctionnant même avec une connexion limitée.',
  },
  {
    icon: 'people',
    title: 'Gestion des comptes',
    desc: 'Inscription et vérification d’identité des professionnels de santé.',
  },
  {
    icon: 'graph-up-arrow',
    title: 'Tableaux de bord',
    desc: 'Statistiques en temps réel pour les professionnels et l’administration.',
  },
  {
    icon: 'lock',
    title: 'Chiffrement end-to-end',
    desc: 'Données médicales chiffrées et conformes aux lois africaines.',
  },
  {
    icon: 'globe-africa',
    title: 'Multi-canaux',
    desc: 'SMS, WhatsApp, web et app mobile pour toucher tous les patients.',
  },
];

const demoAccounts = {
  patient: {
    role: 'patient',
    label: 'Patient démo',
    name: 'Patient Démo',
    email: 'patient@ordotogo.tg',
    password: 'demo123',
  },
  lumen: {
    role: 'pharma',
    label: 'Pharmacie Lumen',
    name: 'Pharmacie Lumen',
    email: 'lumen@ordotogo.tg',
    password: 'demo123',
  },
};

export default function AuthPage() {
  const { login, authError } = useApp();
  const [selected, setSelected] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [demoLabel, setDemoLabel] = useState('');

  const fillDemoAccount = (account) => {
    setRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setDemoLabel(account.label);
    setLoginError('');
  };

  const openLogin = () => {
    setLoginError('');
    setDemoLabel('');
    setLoginOpen(true);
  };

  const closeLogin = () => {
    setLoginOpen(false);
    setLoginError('');
    setDemoLabel('');
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginError('Renseignez votre mail et votre mot de passe.');
      return;
    }

    const result = await login({
      role,
      email: email.trim(),
      password,
    });

    if (result?.error) {
      setLoginError(result.error.message || 'Connexion impossible.');
      return;
    }

    closeLogin();
  };

  const LogoIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
    </svg>
  );


  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', color: 'var(--gray-800)' }}>
      <header style={{
        height: '60px',
        background: '#fff',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '9px', background: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(22, 163, 74, 0.24)' }}>
            <LogoIcon />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--gray-800)' }}>OrdoTogo</span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', color: 'var(--gray-600)', fontSize: '14px', fontWeight: 500 }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Fonctionnalités</a>
          <a href="#actors" style={{ color: 'inherit', textDecoration: 'none' }}>Utilisateurs</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={openLogin}
            style={{
              border: 'none',
              outline: 'none',
              borderRadius: '999px',
              padding: '10px 18px',
              backgroundColor: 'var(--green-800)',
              backgroundImage: 'linear-gradient(135deg, var(--green-800) 0%, var(--green-600) 100%)',
              boxShadow: '0 10px 24px rgba(22, 163, 74, 0.28)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.18)',
            }}
          >
            Connexion
          </button>
        </div>
      </header>

      <main className="main-content" style={{ padding: '0', margin: '0' }}>
        <section style={{
          background: 'radial-gradient(circle at top right, rgba(10, 120, 90, 0.45), transparent 32%), linear-gradient(135deg, #033d31 0%, #065544 55%, #11635a 100%)',
          color: '#fff',
          padding: '70px 24px 80px',
        }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: '48px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', borderRadius: '999px', padding: '8px 14px', fontSize: '13px', marginBottom: '24px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#19d38a' }} />
                Plateforme de santé numérique · Togo
              </div>

              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(42px, 5vw, 68px)', lineHeight: 0.98, letterSpacing: '-1.8px', margin: 0, maxWidth: '760px' }}>
                La prescription médicale <span style={{ color: '#20cf8b' }}>digitalisée</span> au Togo
              </h1>

              <p style={{ marginTop: '24px', maxWidth: '620px', fontSize: '18px', lineHeight: 1.7, color: 'rgba(255,255,255,0.78)' }}>
                Finis avec les ordonnances manuscrites illisibles, les faux médicaments et les fraudes. OrdoTogo sécurise le parcours patient de bout en bout grâce au QR Code et à la signature électronique.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '30px' }}>
                <button type="button" onClick={openLogin} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>
                  <Button size="lg" style={{ borderRadius: '14px', padding: '14px 22px', background: '#1fc889', color: '#fff', boxShadow: '0 18px 34px rgba(31, 200, 137, 0.35)' }}>
                    Accéder à l’espace →
                  </Button>
                </button>
                <a href="#features" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="lg" style={{ borderRadius: '14px', padding: '14px 22px', background: 'transparent', color: 'rgba(255,255,255,0.88)', outline: '1px solid rgba(255,255,255,0.22)' }}>
                    Voir les fonctionnalités
                  </Button>
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '28px', marginTop: '56px', maxWidth: '520px' }}>
                {stats.map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.8px', color: '#20cf8b' }}>{item.value}</div>
                    <div style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.66)' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

          
          </div>
        </section>

        <section id="actors" style={{ background: '#fff', padding: '84px 24px 90px' }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '42px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 3vw, 42px)', margin: 0, color: 'var(--gray-800)' }}>
                Une solution pour chaque acteur
              </h2>
              <p style={{ marginTop: '14px', fontSize: '16px', color: 'var(--gray-400)' }}>
                Chaque professionnel de santé dispose d’une interface adaptée à son métier.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '28px' }}>
              {actorCards.map(card => (
                <div key={card.id} style={{ borderRadius: '22px', overflow: 'hidden', background: '#fff', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 10px 22px rgba(15,23,42,0.06)' }}>
                  <div style={{
                    minHeight: '180px',
                    padding: '20px',
                    background: `${card.imageTone}, radial-gradient(circle at top right, rgba(255,255,255,0.12), transparent 45%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'end',
                    color: '#fff',
                    position: 'relative',
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>{card.role}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, lineHeight: 1.1 }}>{card.title}</div>
                  </div>

                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ display: 'grid', gap: '14px' }}>
                      {card.features.map(feature => (
                        <div key={feature} style={{ display: 'flex', gap: '10px', alignItems: 'start', color: 'var(--gray-600)', fontSize: '14px', lineHeight: 1.5 }}>
                          <BiIcon name="check2-circle" size={18} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      {card.comingSoon ? (
                        <Button fullWidth size="lg" disabled style={{ borderRadius: '12px', background: 'var(--gray-100)', color: 'var(--gray-400)', outline: '1px solid rgba(15,23,42,0.06)' }}>
                          Bientôt disponible
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          size="lg"
                          onClick={() => {
                            setSelected(card.id);
                              openLogin();
                          }}
                          style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--green-50) 0%, #e8fbf1 100%)', color: 'var(--green-800)', outline: '1px solid rgba(22, 163, 74, 0.12)' }}
                        >
                          Voir l’interface →
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" style={{ background: 'linear-gradient(180deg, #05392c 0%, #042b22 100%)', color: '#fff', padding: '88px 24px 100px' }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 3vw, 42px)', margin: 0 }}>Fonctionnalités clés</h2>
              <p style={{ marginTop: '14px', fontSize: '16px', color: 'rgba(255,255,255,0.68)' }}>
                Un cycle complet de la prescription à la délivrance, 100% numérique et sécurisé.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '18px' }}>
              {features.map(feature => (
                <div key={feature.title} id={feature.title === 'Chiffrement end-to-end' ? 'security' : undefined} style={{ borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', padding: '22px', minHeight: '150px', boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(31, 200, 137, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1fc889', marginBottom: '18px' }}>
                    <BiIcon name={feature.icon} size={18} />
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>{feature.title}</div>
                  <div style={{ fontSize: '14px', lineHeight: 1.65, color: 'rgba(255,255,255,0.68)' }}>{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

       
      </main>

      {loginOpen && (
        <div
          role="presentation"
          onClick={closeLogin}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 19, 16, 0.64)',
            backdropFilter: 'blur(10px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            zIndex: 50,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Connexion"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: 'min(100%, 460px)',
              borderRadius: '24px',
              background: '#fff',
              boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '24px 24px 18px', background: 'linear-gradient(135deg, #063c31 0%, #0b5a48 100%)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, lineHeight: 1.1 }}>Connexion</div>
                  <p style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.76)', lineHeight: 1.55 }}>
                    Entrez votre adresse mail et votre mot de passe pour accéder à votre espace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeLogin}
                  aria-label="Fermer la fenêtre de connexion"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '20px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ padding: '22px 24px 24px' }}>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-600)' }}>Type de compte</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'patient', label: 'Patient' },
                    { id: 'pharma', label: 'Pharmacien' },
                  ].map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRole(option.id)}
                      style={{
                        borderRadius: '14px',
                        padding: '12px 14px',
                        border: role === option.id ? '1px solid var(--green-600)' : '1px solid var(--gray-200)',
                        background: role === option.id ? 'var(--green-50)' : '#fff',
                        color: role === option.id ? 'var(--green-800)' : 'var(--gray-600)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-600)' }}>Adresse mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="exemple@ordotogo.tg"
                  autoComplete="email"
                  style={{
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-200)',
                    padding: '0 14px',
                    outline: 'none',
                    fontSize: '15px',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-600)' }}>Mot de passe</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  style={{
                    height: '46px',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-200)',
                    padding: '0 14px',
                    outline: 'none',
                    fontSize: '15px',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </label>

              {(loginError || authError) && (
                <div style={{ marginBottom: '14px', borderRadius: '12px', padding: '10px 12px', background: 'var(--coral-50)', color: 'var(--coral-600)', fontSize: '13px', fontWeight: 600 }}>
                  {loginError || authError}
                </div>
              )}

              <div style={{ marginBottom: '16px', borderRadius: '16px', padding: '16px', background: 'linear-gradient(180deg, var(--gray-50) 0%, #fff 100%)', border: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Comptes de démonstration
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  {Object.values(demoAccounts).map(account => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => fillDemoAccount(account)}
                      style={{
                        borderRadius: '14px',
                        padding: '12px 14px',
                        border: demoLabel === account.label ? '1px solid var(--green-600)' : '1px solid var(--gray-200)',
                        background: demoLabel === account.label ? 'var(--green-50)' : '#fff',
                        color: 'var(--gray-800)',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>{account.label}</div>
                      <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--gray-400)' }}>{account.email}</div>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '12px', display: 'grid', gap: '6px', fontSize: '12px', color: 'var(--gray-600)' }}>
                  <div><strong>Mot de passe :</strong> demo123</div>
                  <div>Cliquer sur un compte remplit automatiquement les champs ci-dessus.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    borderRadius: '999px',
                    padding: '12px 16px',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'var(--green-800)',
                    backgroundImage: 'linear-gradient(135deg, var(--green-800) 0%, var(--green-600) 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 10px 24px rgba(22, 163, 74, 0.28)',
                    textAlign: 'center',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.18)',
                  }}
                >
                  Se connecter
                </button>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={closeLogin}
                    style={{
                      borderRadius: '12px',
                      padding: '12px 16px',
                      border: '1px solid var(--gray-200)',
                      background: '#fff',
                      color: 'var(--gray-600)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        @media (max-width: 1200px) {
          header nav {
            display: none !important;
          }

          section > div {
            grid-template-columns: 1fr !important;
          }

          #features div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          header {
            padding: 0 16px !important;
            gap: 10px;
          }

          header > div:last-child {
            flex-shrink: 0;
          }

          header > div:last-child a:first-child {
            padding: 8px 14px;
            font-size: 13px;
            white-space: nowrap;
          }

          header > div:last-child button {
            padding: 8px 14px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }

          main section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          #actors div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }

          #features div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
