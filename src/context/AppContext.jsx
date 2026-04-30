import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [role, setRole]           = useState(null); // 'patient' | 'pharma'
  const [user, setUser]           = useState(null);

  // ── Patient state ──
  const [patientOrders, setPatientOrders] = useState([]);
  const [activeOrder,   setActiveOrder]   = useState(null);

  // ── Pharmacist state ──
  const [alerts,      setAlerts]      = useState([]);
  const [prepOrders,  setPrepOrders]  = useState([]);

  const login = (selectedRole) => {
    setRole(selectedRole);
    setUser(
      selectedRole === 'patient'
        ? { name: 'Kokou Mensah', id: 'PAT-001' }
        : { name: 'Dr Pharmacie Bénin Santé', id: 'PHAR-001' }
    );
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setActiveOrder(null);
  };

  return (
    <AppContext.Provider value={{
      role, user, login, logout,
      patientOrders, setPatientOrders,
      activeOrder, setActiveOrder,
      alerts, setAlerts,
      prepOrders, setPrepOrders,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
