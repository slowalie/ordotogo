import { createContext, useContext, useEffect, useState } from 'react';
import { STATUS } from '../data/mockData';

const AppContext = createContext(null);
const STORAGE_KEY = 'ordotogo_app_state_v1';

function readPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      role: parsed.role || null,
      user: parsed.user || null,
      patientOrders: Array.isArray(parsed.patientOrders) ? parsed.patientOrders : [],
      activeOrderId: parsed.activeOrderId || null,
    };
  } catch (error) {
    return null;
  }
}

export function AppProvider({ children }) {
  const persisted = readPersistedState();
  const [role, setRole]           = useState(persisted?.role || null); // 'patient' | 'pharma'
  const [user, setUser]           = useState(persisted?.user || null);

  // ── Patient state ──
  const [patientOrders, setPatientOrders] = useState(persisted?.patientOrders || []);
  const [activeOrderId, setActiveOrderId] = useState(persisted?.activeOrderId || null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        role,
        user,
        patientOrders,
        activeOrderId,
      }));
    } catch (error) {
      // Ignore storage write failures.
    }
  }, [role, user, patientOrders, activeOrderId]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;

      if (!event.newValue) {
        setRole(null);
        setUser(null);
        setPatientOrders([]);
        setActiveOrderId(null);
        return;
      }

      try {
        const next = JSON.parse(event.newValue);
        setRole(next.role || null);
        setUser(next.user || null);
        setPatientOrders(Array.isArray(next.patientOrders) ? next.patientOrders : []);
        setActiveOrderId(next.activeOrderId || null);
      } catch (error) {
        // Ignore malformed storage payloads.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = (selectedRole) => {
    setRole(selectedRole);
    setUser(
      selectedRole === 'patient'
        ? { name: 'Kokou Mensah', id: 'PAT-001' }
        : { name: 'Dr Pharmacie Bénin Santé', id: 'PHAR-001', pharmacyId: 1 }
    );
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setActiveOrderId(null);
  };

  const createPatientOrder = ({ file, previewUrl, pharmacy }) => {
    if (!pharmacy) return null;

    const id = `ORD-${Date.now()}`;
    const now = new Date().toISOString();
    const order = {
      id,
      patientName: user?.name || 'Patient',
      patientId: user?.id || 'PAT-000',
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      prescriptionFileName: file?.name || 'ordonnance.jpg',
      prescriptionFileSize: file?.size || 0,
      prescriptionPreview: previewUrl || '',
      status: STATUS.PENDING,
      meds: [],
      conseil: '',
      total: 0,
      paymentMethod: null,
      sentAt: now,
      updatedAt: now,
    };

    setPatientOrders(prev => [order, ...prev]);
    setActiveOrderId(id);
    return id;
  };

  const updateOrder = (orderId, updater) => {
    setPatientOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const patch = typeof updater === 'function' ? updater(order) : updater;
      return { ...order, ...patch, updatedAt: new Date().toISOString() };
    }));
  };

  const submitTranscription = ({ orderId, meds, conseil, total }) => {
    updateOrder(orderId, {
      meds,
      conseil,
      total,
      status: STATUS.WAITING_VALIDATION,
    });
    setActiveOrderId(orderId);
  };

  const markOrderValidated = (orderId, meds, total) => {
    updateOrder(orderId, {
      status: STATUS.VALIDATED,
      meds,
      total,
    });
    setActiveOrderId(orderId);
  };

  const markOrderPaid = (orderId, paymentMethod) => {
    updateOrder(orderId, { status: STATUS.PAID, paymentMethod });
    setActiveOrderId(orderId);
  };

  const markOrderReady = (orderId) => {
    updateOrder(orderId, { status: STATUS.READY });
  };

  const markOrderDelivered = (orderId) => {
    updateOrder(orderId, { status: STATUS.DELIVERED });
  };

  const getOrderById = (orderId) => patientOrders.find(order => order.id === orderId) || null;
  const activeOrder = getOrderById(activeOrderId) || patientOrders[0] || null;

  // All orders awaiting patient action: sent to pharmacist or being transcribed
  const pendingOrders = patientOrders.filter(order => 
    [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION, STATUS.VALIDATED].includes(order.status)
  );

  const alerts = patientOrders.filter(order => order.status === STATUS.PENDING);
  const prepOrders = patientOrders.filter(order => [STATUS.PAID, STATUS.READY].includes(order.status));

  return (
    <AppContext.Provider value={{
      role, user, login, logout,
      patientOrders, setPatientOrders,
      activeOrder,
      setActiveOrderId,
      createPatientOrder,
      submitTranscription,
      markOrderValidated,
      markOrderPaid,
      markOrderReady,
      markOrderDelivered,
      getOrderById,
      alerts,
      prepOrders,
      pendingOrders,
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
