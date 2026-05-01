import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Topbar   from '../../components/shared/Topbar';
import TabNav   from '../../components/shared/TabNav';
import { StepBar } from '../../components/shared/UI';
import StatsDashboard from '../../components/shared/StatsDashboard';

import UploadOrdonnance     from '../../components/patient/UploadOrdonnance';
import ChoixPharmacie       from '../../components/patient/ChoixPharmacie';
import AttenteOrdonnance    from '../../components/patient/AttenteOrdonnance';
import AttentePréparation   from '../../components/patient/AttentePréparation';
import ValidationOrdonnance from '../../components/patient/ValidationOrdonnance';
import PaiementOrdonnance   from '../../components/patient/PaiementOrdonnance';
import ConfirmationPaiement from '../../components/patient/ConfirmationPaiement';
import HistoriquePatient    from '../../components/patient/HistoriquePatient';
import { PHARMACIES, STATUS, MOCK_PATIENT_HISTORY } from '../../data/mockData';

// Send flow steps
const SEND_STEPS = ['Photo', 'Pharmacie', 'Envoi'];

export default function PatientPage() {
  const {
    activeOrder,
    patientOrders,
    pendingOrders,
    waitingDeliveryOrders,
    createPatientOrder,
    markOrderValidated,
    markOrderPaid,
    setActiveOrderId,
  } = useApp();

  const [activeTab,  setActiveTab]  = useState('send');
  const [sendStep,   setSendStep]   = useState(0); // 0=upload, 1=pharmacy, 2=waiting
  const [file,       setFile]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pharmacyId, setPharmacyId] = useState(null);
  const [accepted,   setAccepted]   = useState({});
  const [payMethod,  setPayMethod]  = useState(null);
  const [selectedWaitingOrderId, setSelectedWaitingOrderId] = useState(null);
  const [selectedPreparationOrderId, setSelectedPreparationOrderId] = useState(null);
  const ordStatus = activeOrder?.status || 'idle';

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  useEffect(() => {
    if (!activeOrder?.meds?.length) {
      setAccepted({});
      return;
    }
    const nextAccepted = {};
    activeOrder.meds.forEach(med => {
      nextAccepted[med.id] = true;
    });
    setAccepted(nextAccepted);
    setPharmacyId(activeOrder.pharmacyId);
  }, [activeOrder?.id, activeOrder?.meds]);

  useEffect(() => {
    // Réinitialiser le payMethod quand on change d'ordonnance
    setPayMethod(null);
  }, [activeOrder?.id]);

  const handleFileChange = (f) => setFile(f);

  const handleSend = () => {
    const pharmacy = PHARMACIES.find(ph => ph.id === pharmacyId);
    if (!file || !pharmacy) return;

    createPatientOrder({
      file,
      previewUrl,
      pharmacy,
    });

    // Réinitialiser le formulaire pour permettre une nouvelle ordonnance
    setSendStep(0);
    setFile(null);
    setPreviewUrl('');
    setPharmacyId(null);
  };

  const toggleMed = (id) => {
    setAccepted(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const handleValidate = () => {
    if (!activeOrder?.meds?.length) return;
    const acceptedMeds = activeOrder.meds.filter(med => accepted[med.id] !== false);
    const total = acceptedMeds.reduce((sum, med) => sum + med.price, 0);
    if (!acceptedMeds.length) return;
    markOrderValidated(activeOrder.id, acceptedMeds, total);
    
    // Afficher un message de succès via un toast ou similaire
    // Pour l'instant, rien ne change automatiquement
  };

  const handlePaid = (method) => {
    if (!activeOrder) return;
    setPayMethod(method);
    markOrderPaid(activeOrder.id, method);
    
    // Afficher un message de succès
    // Pour l'instant, rien ne change automatiquement
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl('');
    setPharmacyId(null);
    setSendStep(0);
    setAccepted({});
    setPayMethod(null);
    setActiveTab('send');
  };

  const tabs = [
    { id: 'send',         label: 'Envoyer',      icon: 'send' },
    { id: 'attente',      label: 'En attente',   icon: 'hourglass-split', badge: pendingOrders.filter(o => [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION].includes(o.status)).length },
    { id: 'valider',      label: 'Valider',      icon: 'check-circle', badge: patientOrders.filter(o => o.status === STATUS.VALIDATED).length },
    { id: 'paiement',     label: 'Paiement',     icon: 'credit-card-2-front', badge: patientOrders.filter(o => o.status === STATUS.VALIDATED).length },
    { id: 'preparation',  label: 'Préparation',  icon: 'box2', badge: patientOrders.filter(o => [STATUS.PREPARING, STATUS.READY_FOR_PICKUP].includes(o.status)).length },
    { id: 'historique',   label: 'Historique',   icon: 'journal-text' },
  ];

  const patientHistory = MOCK_PATIENT_HISTORY || [];
  const getStats = () => {
    const attenteOrders = pendingOrders.filter(o => [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION].includes(o.status));
    const validatedOrders = patientOrders.filter(o => o.status === STATUS.VALIDATED);
    const preparingOrders = patientOrders.filter(o => [STATUS.PREPARING, STATUS.READY_FOR_PICKUP].includes(o.status));
    
    return [
      { label: 'En Attente', value: attenteOrders.length, bgColor: '#eff6ff', iconColor: '#2563eb', onClick: () => setActiveTab('attente') },
      { label: 'Validées', value: validatedOrders.length, bgColor: '#f0fdf4', iconColor: '#16a34a', onClick: () => setActiveTab('valider') },
      { label: 'En Préparation', value: preparingOrders.length, bgColor: '#fef3c7', iconColor: '#d97706', onClick: () => setActiveTab('preparation') },
    ];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'send': {
        const attenteOrders = pendingOrders.filter(o => [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION].includes(o.status));
        
        return (
          <div>
            {attenteOrders.length > 0 && (
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 'var(--radius)',
                fontSize: '14px',
                color: 'var(--blue-700)'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>ℹ️ {attenteOrders.length} ordonnance(s) en cours de traitement</div>
                <div style={{ fontSize: '13px', color: 'var(--blue-600)' }}>
                  Vous pouvez envoyer une nouvelle ordonnance en parallèle. Consultez l'onglet "En attente" pour suivre vos ordonnances.
                </div>
              </div>
            )}
            {sendStep < 2 && <StepBar steps={SEND_STEPS} current={sendStep} />}
            {sendStep === 0 && (
              <UploadOrdonnance
                file={file}
                previewUrl={previewUrl}
                onFileChange={handleFileChange}
                onNext={() => setSendStep(1)}
              />
            )}
            {sendStep === 1 && (
              <ChoixPharmacie
                selected={pharmacyId}
                onSelect={setPharmacyId}
                onSend={handleSend}
                onBack={() => setSendStep(0)}
              />
            )}
          </div>
        );
      }

      case 'attente': {
        const attenteOrders = pendingOrders.filter(o => [STATUS.PENDING, STATUS.PROCESSING, STATUS.WAITING_VALIDATION].includes(o.status));
        if (attenteOrders.length === 0) {
          return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Aucune ordonnance en attente. <button onClick={() => setActiveTab('send')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Envoyer une ordonnance →</button>
          </div>;
        }
        const handleSelectOrder = (orderId) => {
          setSelectedWaitingOrderId(orderId);
          setActiveOrderId(orderId);
        };
        return <AttenteOrdonnance orders={attenteOrders} selectedOrderId={selectedWaitingOrderId || activeOrder?.id} onSelectOrder={handleSelectOrder} />;
      }

      case 'valider': {
        const validationOrders = patientOrders.filter(o => o.status === STATUS.WAITING_VALIDATION);
        if (validationOrders.length === 0) {
          return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Aucune ordonnance à valider. <button onClick={() => setActiveTab('send')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Envoyer une ordonnance →</button>
          </div>;
        }
        
        const selectedOrder = validationOrders.find(o => o.id === activeOrder?.id) || validationOrders[0];
        if (!selectedOrder) return null;
        
        const handleSelectValidationOrder = (orderId) => {
          setActiveOrderId(orderId);
        };
        
        return (
          <div>
            {validationOrders.length > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Ordonnances à valider ({validationOrders.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {validationOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectValidationOrder(order.id)}
                      style={{
                        padding: '8px 12px',
                        border: selectedOrder.id === order.id ? '2px solid var(--green-600)' : '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius)',
                        background: selectedOrder.id === order.id ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: selectedOrder.id === order.id ? 'var(--green-700)' : 'var(--gray-700)',
                        transition: 'all .2s'
                      }}
                    >
                      {order.pharmacyName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ValidationOrdonnance prescription={selectedOrder?.meds || []} accepted={accepted} onToggle={toggleMed} onConfirm={handleValidate} />
          </div>
        );
      }

      case 'paiement': {
        const paymentOrders = patientOrders.filter(o => o.status === STATUS.VALIDATED);
        if (paymentOrders.length === 0) {
          return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Aucune ordonnance à payer. <button onClick={() => setActiveTab('valider')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Valider une ordonnance →</button>
          </div>;
        }
        
        const selectedOrder = paymentOrders.find(o => o.id === activeOrder?.id) || paymentOrders[0];
        if (!selectedOrder) return null;
        
        const handleSelectPaymentOrder = (orderId) => {
          setActiveOrderId(orderId);
          setPharmacyId(selectedOrder.pharmacyId);
        };
        
        return (
          <div>
            {paymentOrders.length > 1 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Ordonnances à payer ({paymentOrders.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {paymentOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={() => handleSelectPaymentOrder(order.id)}
                      style={{
                        padding: '8px 12px',
                        border: selectedOrder.id === order.id ? '2px solid var(--green-600)' : '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius)',
                        background: selectedOrder.id === order.id ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: selectedOrder.id === order.id ? 'var(--green-700)' : 'var(--gray-700)',
                        transition: 'all .2s'
                      }}
                    >
                      {order.pharmacyName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <PaiementOrdonnance pharmacyId={selectedOrder.pharmacyId} meds={selectedOrder?.meds || []} total={selectedOrder?.total || 0} onConfirm={handlePaid} />
          </div>
        );
      }

      case 'preparation': {
        if (waitingDeliveryOrders.length === 0) {
          return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Aucune ordonnance en préparation. <button onClick={() => setActiveTab('send')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Envoyer une ordonnance →</button>
          </div>;
        }
        const handleSelectPrepOrder = (orderId) => {
          setSelectedPreparationOrderId(orderId);
          setActiveOrderId(orderId);
        };
        return <AttentePréparation orders={waitingDeliveryOrders} selectedOrderId={selectedPreparationOrderId || activeOrder?.id} onSelectOrder={handleSelectPrepOrder} />;
      }

      case 'confirmation': {
        const paidOrders = patientOrders.filter(o => o.status === STATUS.PAID);
        if (paidOrders.length === 0) {
          return <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Aucune commande payée. <button onClick={() => setActiveTab('paiement')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Payer une ordonnance →</button>
          </div>;
        }
        
        const selectedOrder = paidOrders.find(o => o.id === activeOrder?.id) || paidOrders[0];
        if (!selectedOrder) return null;
        
        return <ConfirmationPaiement method={payMethod || selectedOrder?.paymentMethod} pharmacyId={selectedOrder.pharmacyId} onReset={() => {
          handleReset();
          setActiveTab('send');
        }} />;
      }

      case 'historique':
        return <HistoriquePatient />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar />
      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <main className="container" style={{ flex: 1, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>
        <div style={{ marginBottom: '18px' }}>
          <StatsDashboard stats={getStats()} columns={3} />
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
