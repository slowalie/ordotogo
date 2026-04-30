import { useApp } from './context/AppContext';
import AuthPage      from './pages/AuthPage';
import PatientPage   from './pages/patient/PatientPage';
import PharmacistPage from './pages/pharmacist/PharmacistPage';

export default function App() {
  const { role } = useApp();

  if (!role)           return <AuthPage />;
  if (role === 'patient') return <PatientPage />;
  return <PharmacistPage />;
}
