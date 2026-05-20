import { createContext, useContext, useEffect, useState } from 'react';
import { STATUS } from '../data/mockData';
import {
  getCurrentSession,
  onAuthStateChange,
  resolveUserWorkspace,
  signInWithPassword,
  signOut as supabaseSignOut,
  createPatientOrder as apiCreatePatientOrder,
  submitTranscription as apiSubmitTranscription,
  markOrderValidated as apiMarkOrderValidated,
  markOrderPaid as apiMarkOrderPaid,
  markOrderReady as apiMarkOrderReady,
  markPreparationComplete as apiMarkPreparationComplete,
  validateDelivery as apiValidateDelivery,
  fetchWorkspaceSnapshot,
  createSignedUrlsForPaths,
  subscribeToWorkspaceChanges,
} from '../services/supabaseApi';
import { isSupabaseConfigured } from '../lib/supabaseClient';

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

function toDisplayName(profile, email) {
  if (profile?.display_name) return profile.display_name;

  const localPart = String(email || '').split('@')[0] || '';
  const prettyName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return prettyName || 'Utilisateur';
}

async function loadWorkspaceForUser(sessionUser) {
  if (!sessionUser) {
    return {
      role: null,
      user: null,
      ownedPharmacy: null,
    };
  }

  const { data: workspace } = await resolveUserWorkspace();

  const profile = workspace?.profile || null;
  const ownedPharmacy = workspace?.ownedPharmacy || null;
  const resolvedRole = workspace?.role === 'pharmacist' ? 'pharmacist' : 'patient';
  const email = sessionUser.email || '';

  return {
    role: resolvedRole,
    ownedPharmacy,
    user: {
      id: sessionUser.id,
      email,
      name: toDisplayName(profile, email),
      role: resolvedRole,
      pharmacyId: ownedPharmacy?.id || null,
      pharmacyName: ownedPharmacy?.name || null,
      profile,
      ownedPharmacy,
    },
  };
}

async function loadWorkspaceOrders() {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data } = await fetchWorkspaceSnapshot();
  return Array.isArray(data?.orders) ? data.orders : [];
}

async function refreshOrderPreviews(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    return orders || [];
  }

  const signedUrlsByPath = await createSignedUrlsForPaths(
    orders.map(order => order.prescriptionFilePath).filter(Boolean)
  );

  return orders.map(order => ({
    ...order,
    prescriptionPreview: signedUrlsByPath[order.prescriptionFilePath] || order.prescriptionPreview || '',
  }));
}

export function AppProvider({ children }) {
  const persisted = readPersistedState();
  const [role, setRole] = useState(isSupabaseConfigured ? null : persisted?.role || null);
  const [user, setUser] = useState(isSupabaseConfigured ? null : persisted?.user || null);
  const [ownedPharmacy, setOwnedPharmacy] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [authError, setAuthError] = useState('');

  // ── Patient state ──
  const [patientOrders, setPatientOrders] = useState(isSupabaseConfigured ? [] : persisted?.patientOrders || []);
  const [activeOrderId, setActiveOrderId] = useState(isSupabaseConfigured ? null : persisted?.activeOrderId || null);

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
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return undefined;
    }

    let isMounted = true;

    const syncSession = async (sessionUser) => {
      setAuthReady(false);
      setAuthError('');

      try {
        const [workspace, orders] = await Promise.all([
          loadWorkspaceForUser(sessionUser),
          loadWorkspaceOrders(),
        ]);
        if (!isMounted) return;

        const nextOrders = await refreshOrderPreviews(orders);
        if (!isMounted) return;

        setRole(workspace.role);
        setUser(workspace.user);
        setOwnedPharmacy(workspace.ownedPharmacy);
        setPatientOrders(nextOrders);
        setActiveOrderId(currentActiveOrderId => {
          if (currentActiveOrderId && nextOrders.some(order => order.id === currentActiveOrderId)) {
            return currentActiveOrderId;
          }
          return nextOrders[0]?.id || currentActiveOrderId || null;
        });
      } catch (error) {
        if (!isMounted) return;

        setRole(null);
        setUser(null);
        setOwnedPharmacy(null);
        setAuthError(error?.message || 'Impossible de charger votre espace.');
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    getCurrentSession().then(({ data }) => {
      if (!isMounted) return;
      syncSession(data?.session?.user || null);
    });

    const { data } = onAuthStateChange((_event, session) => {
      syncSession(session?.user || null);
    });

    const workspaceSubscription = subscribeToWorkspaceChanges((payload) => {
      if (payload?.schema !== 'public') return;
      if (!['orders', 'order_items', 'pharmacies', 'profiles'].includes(payload.table)) return;
      if (!isMounted) return;

      loadWorkspaceOrders().then((orders) => {
        if (!isMounted) return;

        refreshOrderPreviews(orders).then((normalizedOrders) => {
          if (!isMounted) return;
          setPatientOrders(normalizedOrders);
          setActiveOrderId(currentActiveOrderId => {
            if (currentActiveOrderId && normalizedOrders.some(order => order.id === currentActiveOrderId)) {
              return currentActiveOrderId;
            }
            return normalizedOrders[0]?.id || currentActiveOrderId || null;
          });
        });
      });
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
      workspaceSubscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      return undefined;
    }

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

  const login = async (credentialsOrRole) => {
    if (!isSupabaseConfigured) {
      const selectedRole = typeof credentialsOrRole === 'string'
        ? credentialsOrRole
        : credentialsOrRole?.role || 'patient';
      const email = typeof credentialsOrRole === 'object' ? credentialsOrRole?.email || '' : '';
      const displayName = typeof credentialsOrRole === 'object' ? credentialsOrRole?.displayName || '' : '';

      setRole(selectedRole === 'pharma' ? 'pharmacist' : selectedRole);

      if (selectedRole === 'patient') {
        const localPart = email.split('@')[0] || '';
        const prettyName = localPart
          .split(/[._-]+/)
          .filter(Boolean)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        setUser({
          name: displayName || prettyName || 'Kokou Mensah',
          id: 'PAT-001',
          email: email || 'patient@ordotogo.tg',
          role: 'patient',
        });
        return { error: null };
      }

      setUser({
        name: displayName || 'Pharmacie Lumen',
        id: 'PHAR-001',
        pharmacyId: 1,
        email: email || 'pharmacielumen@gmail.com',
        role: 'pharmacist',
      });
      return { error: null };
    }

    const email = typeof credentialsOrRole === 'object' ? credentialsOrRole?.email || '' : '';
    const password = typeof credentialsOrRole === 'object' ? credentialsOrRole?.password || '' : '';

    if (!email.trim() || !password.trim()) {
      const error = new Error('Renseignez votre mail et votre mot de passe.');
      setAuthError(error.message);
      return { error };
    }

    setAuthError('');
    const { error } = await signInWithPassword(email.trim(), password);

    if (error) {
      setAuthError(error.message || 'Connexion impossible.');
      return { error };
    }

    return { error: null };
  };

  const logout = async () => {
    setAuthError('');

    if (isSupabaseConfigured) {
      await supabaseSignOut();
    }

    setRole(null);
    setUser(null);
    setOwnedPharmacy(null);
    setActiveOrderId(null);
  };

  const createPatientOrder = async ({ file, previewUrl, pharmacy }) => {
    if (!pharmacy) return null;

    if (!isSupabaseConfigured) {
      // Fallback to local optimistic behavior when Supabase isn't configured
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
        pickupCode: null,
        qrCode: null,
        readyAt: null,
      };

      setPatientOrders(prev => [order, ...prev]);
      setActiveOrderId(id);
      return id;
    }

    try {
      const userId = user?.id;
      const { data, error } = await apiCreatePatientOrder({ userId, pharmacyId: pharmacy.id, file, previewUrl: null });
      if (error) {
        throw error;
      }

      const createdOrderId = data?.orderId;
      const previewMap = await createSignedUrlsForPaths([data?.filePath].filter(Boolean));
      const previewUrlFromStorage = data?.filePath ? previewMap[data.filePath] || '' : '';

      const now = new Date().toISOString();
      const optimisticOrder = {
        id: createdOrderId || `ORD-${Date.now()}`,
        patientName: user?.name || 'Patient',
        patientId: userId || 'PAT-000',
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        pharmacyZone: pharmacy.zone || '',
        pharmacyPhone: pharmacy.phone || '',
        prescriptionFilePath: data?.filePath || null,
        prescriptionFileName: file?.name || 'ordonnance.jpg',
        prescriptionFileSize: file?.size || 0,
        prescriptionPreview: previewUrlFromStorage || previewUrl || '',
        status: STATUS.PENDING,
        conseil: '',
        total: 0,
        paymentMethod: null,
        sentAt: now,
        updatedAt: now,
        pickupCode: null,
        qrCode: null,
        readyAt: null,
        deliveredAt: null,
        meds: [],
      };

      setPatientOrders(prevOrders => [optimisticOrder, ...prevOrders.filter(order => order.id !== optimisticOrder.id)]);
      if (createdOrderId) setActiveOrderId(createdOrderId);
      return createdOrderId;
    } catch (err) {
      // On error, return null (caller may show UI feedback)
      return null;
    }
  };

  const updateOrder = (orderId, updater) => {
    setPatientOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      const patch = typeof updater === 'function' ? updater(order) : updater;
      return { ...order, ...patch, updatedAt: new Date().toISOString() };
    }));
  };

  const submitTranscription = async ({ orderId, meds, conseil, total }) => {
    if (isSupabaseConfigured) {
      const { error } = await apiSubmitTranscription({
        orderId,
        pharmacistId: user?.id || null,
        meds,
        conseil,
        total,
      });

      if (error) return false;

      await refreshWorkspace();
      return true;
    }

    updateOrder(orderId, {
      meds,
      conseil,
      total,
      status: STATUS.WAITING_VALIDATION,
    });
    setActiveOrderId(orderId);
    return true;
  };

  const markOrderValidated = async (orderId, meds, total) => {
    if (isSupabaseConfigured) {
      const { error } = await apiMarkOrderValidated(orderId, meds, total);
      if (error) return false;

      updateOrder(orderId, {
        status: STATUS.VALIDATED,
        meds,
        total,
      });
      setActiveOrderId(orderId);
      await refreshWorkspace();
      return true;
    }

    updateOrder(orderId, {
      status: STATUS.VALIDATED,
      meds,
      total,
    });
    setActiveOrderId(orderId);
    return true;
  };

  const markOrderPaid = async (orderId, paymentMethod) => {
    if (isSupabaseConfigured) {
      const { error } = await apiMarkOrderPaid(orderId, paymentMethod);
      if (error) return false;

      updateOrder(orderId, { status: STATUS.PAID, paymentMethod });
      setActiveOrderId(orderId);
      await refreshWorkspace();
      return true;
    }

    updateOrder(orderId, { status: STATUS.PAID, paymentMethod });
    setActiveOrderId(orderId);
    return true;
  };

  // Génère un code de 6 chiffres aléatoire
  const generatePickupCode = () => {
    return String(Math.floor(Math.random() * 900000) + 100000);
  };

  // Génère les données QR code (contient le code de récupération et l'ID de la commande)
  const generateQRCodeData = (orderId, pickupCode) => {
    return JSON.stringify({
      orderId,
      pickupCode,
      timestamp: new Date().toISOString(),
    });
  };

  // Marque la préparation comme terminée et génère les codes
  const markPreparationComplete = async (orderId) => {
    if (isSupabaseConfigured) {
      const { error } = await apiMarkPreparationComplete(orderId);
      if (error) return false;

      await refreshWorkspace();
      return true;
    }

    const pickupCode = generatePickupCode();
    const qrCodeData = generateQRCodeData(orderId, pickupCode);

    updateOrder(orderId, {
      status: STATUS.READY_FOR_PICKUP,
      pickupCode,
      qrCode: qrCodeData,
      readyAt: new Date().toISOString(),
    });
    return true;
  };

  // Valide la livraison avec le code de récupération
  const validateDelivery = async (orderId, submittedCode) => {
    if (isSupabaseConfigured) {
      const { data, error } = await apiValidateDelivery(orderId, submittedCode);
      if (error) return false;

      if (data) {
        await refreshWorkspace();
      }

      return Boolean(data);
    }

    const order = getOrderById(orderId);
    if (!order) return false;

    // Vérifie si le code soumis correspond au code de récupération
    if (order.pickupCode === submittedCode) {
      updateOrder(orderId, {
        status: STATUS.DELIVERED,
        deliveredAt: new Date().toISOString(),
      });
      return true;
    }

    return false;
  };

  const markOrderReady = async (orderId) => {
    if (isSupabaseConfigured) {
      const { error } = await apiMarkOrderReady(orderId);
      if (error) {
        const msg = String(error?.message || '').toLowerCase();
        const rpcMissing = msg.includes('mark_order_ready') || error?.code === '42883';
        if (rpcMissing) {
          // RPC not deployed on the Supabase instance — fallback to local optimistic update
          updateOrder(orderId, { status: STATUS.PREPARING });
          setActiveOrderId(orderId);
          return true;
        }
        return false;
      }

      updateOrder(orderId, { status: STATUS.PREPARING });
      setActiveOrderId(orderId);
      await refreshWorkspace();
      return true;
    }

    updateOrder(orderId, { status: STATUS.PREPARING });
    return true;
  };

  const markOrderDelivered = (orderId) => {
    updateOrder(orderId, { status: STATUS.DELIVERED });
  };

  const getOrderById = (orderId) => patientOrders.find(order => order.id === orderId) || null;
  const activeOrder = getOrderById(activeOrderId) || patientOrders[0] || null;

  // All orders awaiting patient action: sent to pharmacist or being transcribed
  const refreshWorkspace = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const orders = await loadWorkspaceOrders();
      const normalizedOrders = await refreshOrderPreviews(orders);
      setPatientOrders(normalizedOrders.length > 0 ? normalizedOrders : []);
      setActiveOrderId(currentActiveOrderId => {
        if (currentActiveOrderId && normalizedOrders.some(order => order.id === currentActiveOrderId)) {
          return currentActiveOrderId;
        }
        return normalizedOrders[0]?.id || currentActiveOrderId || null;
      });
    } catch (error) {
      // Ignore refresh errors
    }
  };

  const pendingOrders = patientOrders.filter(order => 
    [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION, STATUS.VALIDATED].includes(order.status)
  );

  const alerts = patientOrders.filter(order => order.status === STATUS.PENDING);
  const prepOrders = patientOrders.filter(order => [STATUS.PAID, STATUS.PREPARING].includes(order.status));
  const waitingDeliveryOrders = patientOrders.filter(order => [STATUS.READY_FOR_PICKUP, STATUS.AWAITING_DELIVERY].includes(order.status));

  return (
    <AppContext.Provider value={{
      role,
      user,
      ownedPharmacy,
      authReady,
      authError,
      login,
      logout,
      patientOrders, setPatientOrders,
      activeOrder,
      setActiveOrderId,
      createPatientOrder,
      submitTranscription,
      markOrderValidated,
      markOrderPaid,
      markOrderReady,
      markPreparationComplete,
      validateDelivery,
      markOrderDelivered,
      getOrderById,
      refreshWorkspace,
      alerts,
      prepOrders,
      waitingDeliveryOrders,
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
