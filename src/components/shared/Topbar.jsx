import { useApp } from '../../context/AppContext';
import { NotifBadge, Avatar } from './UI';

const Logo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
  </svg>
);

export default function Topbar({ notifCount = 0 }) {
  const { role, user, logout } = useApp();

  return (
    <header className="app-topbar topbar">
      {/* Left – brand */}
      <div className="brand">
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--green-400), var(--green-600))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(34,197,94,.18)' }}>
          <Logo />
        </div>
        <div>
          <div className="brand-title">
            OrdoTogo
          </div>
          <div className="brand-subtitle">
            {role === 'patient' ? 'Espace Patient' : 'Espace Pharmacien'}
          </div>
        </div>
      </div>

      {/* Right – user + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {notifCount > 0 && <NotifBadge count={notifCount} />}
        <div className="hide-mobile" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{role === 'patient' ? 'Patient' : 'Pharmacien'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="show-mobile">
            <Avatar name={user?.name} size={36} />
          </div>
          <button className="btn-outline" onClick={logout}>Déconnexion</button>
        </div>
      </div>
    </header>
  );
}
