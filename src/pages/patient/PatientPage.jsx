import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import Topbar   from '../../components/shared/Topbar';
import TabNav   from '../../components/shared/TabNav';
import { StepBar } from '../../components/shared/UI';

import UploadOrdonnance     from '../../components/patient/UploadOrdonnance';
import ChoixPharmacie       from '../../components/patient/ChoixPharmacie';
import AttenteOrdonnance    from '../../components/patient/AttenteOrdonnance';
import ValidationOrdonnance from '../../components/patient/ValidationOrdonnance';
import PaiementOrdonnance   from '../../components/patient/PaiementOrdonnance';
import ConfirmationPaiement from '../../components/patient/ConfirmationPaiement';
import HistoriquePatient    from '../../components/patient/HistoriquePatient';
import { PHARMACIES, STATUS } from '../../data/mockData';

// Send flow steps
const SEND_STEPS = ['Photo', 'Pharmacie', 'Envoi'];

export default function PatientPage() {
  const {
    activeOrder,
    pendingOrders,
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
  const ordStatus = activeOrder?.status || 'idle';

  useEffect(() => {
    if (!activeOrder) return;

    if ([STATUS.PENDING, STATUS.PROCESSING].includes(activeOrder.status)) {
      setSendStep(2);
      setActiveTab('attente');
      return;
    }

    if (activeOrder.status === STATUS.WAITING_VALIDATION) {
      setActiveTab('valider');
    }
  }, [activeOrder?.id, activeOrder?.status]);

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

  const handleFileChange = (f) => setFile(f);

  const handleSend = () => {
    const pharmacy = PHARMACIES.find(ph => ph.id === pharmacyId);
    if (!file || !pharmacy) return;

    createPatientOrder({
      file,
      previewUrl,
      pharmacy,
    });

    setSendStep(2);
    setActiveTab('attente');
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
    setActiveTab('paiement');
  };

  const handlePaid = (method) => {
    if (!activeOrder) return;
    setPayMethod(method);
    markOrderPaid(activeOrder.id, method);
    setActiveTab('confirmation');
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
    { id: 'send',         label: 'Envoyer',    icon: 'send' },
    { id: 'attente',      label: 'En attente', icon: 'hourglass-split', badge: [STATUS.PENDING, STATUS.PROCESSING].includes(ordStatus) ? 1 : 0 },
    { id: 'valider',      label: 'Valider',    icon: 'check-circle', badge: ordStatus === STATUS.WAITING_VALIDATION ? 1 : 0 },
    { id: 'paiement',     label: 'Paiement',   icon: 'credit-card-2-front', badge: ordStatus === STATUS.VALIDATED ? 1 : 0 },
    { id: 'confirmation', label: 'Confirmé',   icon: 'check2-circle', badge: 0 },
    { id: 'historique',   label: 'Historique', icon: 'journal-text' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'send':
        return (
          <div>
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

      case 'valider':
        return [STATUS.WAITING_VALIDATION, STATUS.VALIDATED, STATUS.PAID].includes(ordStatus)
          ? <ValidationOrdonnance prescription={activeOrder?.meds || []} accepted={accepted} onToggle={toggleMed} onConfirm={handleValidate} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              En attente de la réponse du pharmacien.
            </div>;

      case 'paiement':
        return [STATUS.VALIDATED, STATUS.PAID].includes(ordStatus)
          ? <PaiementOrdonnance pharmacyId={pharmacyId} meds={activeOrder?.meds || []} total={activeOrder?.total || 0} onConfirm={handlePaid} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Validez d'abord vos médicaments.
            </div>;

      case 'confirmation':
        return [STATUS.PAID, STATUS.READY, STATUS.DELIVERED].includes(ordStatus)
          ? <ConfirmationPaiement method={payMethod || activeOrder?.paymentMethod} pharmacyId={pharmacyId} onReset={handleReset} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Aucune commande confirmée.
            </div>;

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
        {renderContent()}
      </main>
    </div>
  );
}
