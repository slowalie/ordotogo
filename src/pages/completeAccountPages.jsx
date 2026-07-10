import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { completeInvitedAccount, getCurrentSession, onAuthStateChange } from '../services/supabaseApi';

const inputStyle = {
  width: '100%',
  borderRadius: '14px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  padding: '14px 16px',
  fontSize: '15px',
  outline: 'none',
  background: '#fff',
  color: 'var(--gray-800)',
};

export default function CompleteAccountPage() {
  const navigate = useNavigate();
  const { refreshWorkspace } = useApp();
  const [sessionReady, setSessionReady] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionReady(true);
      return undefined;
    }

    let isMounted = true;

    const syncUser = (user) => {
      if (!isMounted) return;
      setCurrentUser(user || null);
      setEmail(user?.email || '');

      const metadata = user?.user_metadata || {};
      setDisplayName(metadata.display_name || '');
      setSessionReady(true);
    };

    getCurrentSession().then(({ data }) => {
      syncUser(data?.session?.user || null);
    });

    const { data } = onAuthStateChange((_event, session) => {
      syncUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) {
      setError('Ouvrez le lien d’invitation reçu par email.');
      return;
    }

    if (!displayName.trim() || !password.trim()) {
      setError('Renseignez votre nom d\'affichage et mot de passe.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setSaving(true);

    const result = await completeInvitedAccount({
      displayName,
      password,
    });

    setSaving(false);

    if (result?.error) {
      setError(result.error.message || 'Impossible de finaliser le compte.');
      return;
    }

    setSuccess('Compte finalisé. Redirection en cours...');

    try {
      await refreshWorkspace();
    } catch (workspaceError) {
      // Ignore refresh errors here; the auth state will be reloaded on navigation.
    }

    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  if (!sessionReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #f4f9f7 0%, #edf5f2 100%)', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
        <div>Vérification du lien d’invitation...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, rgba(10, 120, 90, 0.12), transparent 28%), linear-gradient(135deg, #f7faf8 0%, #eef5f1 100%)', color: 'var(--gray-800)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: '28px', alignItems: 'stretch' }}>
          <section style={{ borderRadius: '28px', padding: '36px', background: 'linear-gradient(145deg, #063f33 0%, #0a6a54 55%, #0e8465 100%)', color: '#fff', boxShadow: '0 24px 60px rgba(4, 71, 57, 0.22)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '8px 12px', background: 'rgba(255,255,255,0.12)', marginBottom: '18px', fontSize: '13px' }}>
              Invitation sécurisée
            </div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 4vw, 54px)', lineHeight: 1.02, letterSpacing: '-1.2px' }}>
              Finalisez votre accès à OrdoTogo
            </h1>
            <p style={{ marginTop: '18px', marginBottom: 0, maxWidth: '560px', fontSize: '16px', lineHeight: 1.7, color: 'rgba(255,255,255,0.86)' }}>
              Renseignez votre nom d'affichage et un mot de passe personnel pour activer votre compte via le lien reçu par email.
            </p>

            <div style={{ marginTop: '28px', display: 'grid', gap: '14px' }}>
              <div style={{ borderRadius: '20px', padding: '16px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Adresse invitée</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{email || 'Non détectée'}</div>
              </div>
              <div style={{ borderRadius: '20px', padding: '16px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>Ce qui sera enregistré</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>Profil + mot de passe de connexion</div>
              </div>
            </div>
          </section>

          <section style={{ borderRadius: '28px', padding: '32px', background: '#fff', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px', fontFamily: 'var(--font-display)', fontSize: '28px' }}>Créer votre mot de passe</h2>
            <p style={{ marginTop: 0, marginBottom: '24px', color: 'var(--gray-600)', lineHeight: 1.6 }}>
              Complétez les informations demandées pour finaliser votre compte.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                Nom d'affichage
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nom affiché sur le compte"
                  style={inputStyle}
                  autoComplete="name"
                />
              </label>

              <label style={{ display: 'grid', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                Adresse email
                <input
                  value={email}
                  readOnly
                  style={{ ...inputStyle, background: 'var(--gray-50)', color: 'var(--gray-600)' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 caractères"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </label>

              <label style={{ display: 'grid', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                Confirmation du mot de passe
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Retapez votre mot de passe"
                  style={inputStyle}
                  autoComplete="new-password"
                />
              </label>

              {error ? (
                <div style={{ borderRadius: '14px', padding: '12px 14px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '14px' }}>
                  {error}
                </div>
              ) : null}

              {success ? (
                <div style={{ borderRadius: '14px', padding: '12px 14px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '14px' }}>
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '14px 18px',
                  background: saving ? 'var(--gray-400)' : 'linear-gradient(135deg, var(--green-800) 0%, var(--green-600) 100%)',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 14px 28px rgba(22, 163, 74, 0.22)',
                }}
              >
                {saving ? 'Finalisation...' : 'Finaliser mon compte'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}