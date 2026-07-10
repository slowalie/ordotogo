import { useApp } from './context/AppContext';
import { useLocation } from 'react-router-dom';
import AuthPage      from './pages/AuthPage';
import CompleteAccountPage from './pages/completeAccountPages';
import PatientPage   from './pages/patient/PatientPage';
import PharmacistPage from './pages/pharmacist/PharmacistPage';

export default function App() {
  const { role, authReady } = useApp();
  const location = useLocation();

  if (location.pathname === '/complete-account') {
    return <CompleteAccountPage />;
  }

  if (!authReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--gray-50)', color: 'var(--gray-700)', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, marginBottom: '10px' }}>OrdoTogo</div>
          <div>Chargement de votre session Supabase...</div>
        </div>
      </div>
    );
  }

  if (!role)           return <AuthPage />;
  if (role === 'patient') return <PatientPage />;
  return <PharmacistPage />;
}
