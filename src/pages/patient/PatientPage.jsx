import { useState } from 'react';
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
import StatsDashboard from '../../components/shared/StatsDashboard';
import { MOCK_PATIENT_HISTORY } from '../../data/mockData';

const IconClock = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);

const IconCheck = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCard = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Send flow steps
const SEND_STEPS = ['Photo', 'Pharmacie', 'Envoi'];

export default function PatientPage() {
  const [activeTab,  setActiveTab]  = useState('send');
  const [sendStep,   setSendStep]   = useState(0); // 0=upload, 1=pharmacy, 2=waiting
  const [file,       setFile]       = useState(null);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [ordStatus,  setOrdStatus]  = useState('idle'); // idle | waiting | received | validated | paid
  const [accepted,   setAccepted]   = useState({});
  const [payMethod,  setPayMethod]  = useState(null);

  const handleFileChange = (f) => setFile(f);

  const handleSend = () => {
    setSendStep(2);
    setOrdStatus('waiting');
    setActiveTab('attente');
  };

  const handleReceived = () => {
    setOrdStatus('received');
    setActiveTab('valider');
  };

  const toggleMed = (id) => {
    setAccepted(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  const handleValidate = () => {
    setOrdStatus('validated');
    setActiveTab('paiement');
  };

  const handlePaid = (method) => {
    setPayMethod(method);
    setOrdStatus('paid');
    setActiveTab('confirmation');
  };

  const handleReset = () => {
    setFile(null);
    setPharmacyId(null);
    setSendStep(0);
    setOrdStatus('idle');
    setAccepted({});
    setPayMethod(null);
    setActiveTab('send');
  };

  const tabs = [
    { id: 'send',         label: 'Envoyer',    icon: 'send' },
    { id: 'attente',      label: 'En attente', icon: 'hourglass-split', badge: ordStatus === 'waiting' ? 1 : 0 },
    { id: 'valider',      label: 'Valider',    icon: 'check-circle', badge: ordStatus === 'received' ? 1 : 0 },
    { id: 'paiement',     label: 'Paiement',   icon: 'credit-card-2-front', badge: ordStatus === 'validated' ? 1 : 0 },
    { id: 'confirmation', label: 'Confirmé',   icon: 'check2-circle', badge: 0 },
    { id: 'historique',   label: 'Historique', icon: 'journal-text' },
  ];

  const patientHistory = MOCK_PATIENT_HISTORY || [];
  const getStats = () => {
    const waiting = ordStatus === 'waiting' ? 1 : 0;
    const validated = ordStatus === 'validated' ? 1 : 0;
    const paid = ordStatus === 'paid' ? 1 : 0;
    const total = patientHistory.length + (ordStatus !== 'idle' ? 1 : 0);
    return [
      { label: 'En Attente', value: waiting, icon: IconClock, bgColor: '#eff6ff', iconColor: '#2563eb', onClick: () => setActiveTab('attente') },
      { label: 'Validées', value: validated, icon: IconCheck, bgColor: '#f0fdf4', iconColor: '#16a34a', onClick: () => setActiveTab('valider') },
      { label: 'Payées', value: paid, icon: IconCard, bgColor: '#fdf4ff', iconColor: '#9333ea', onClick: () => setActiveTab('paiement') },
    ];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'send':
        return (
          <div>
            {sendStep < 2 && <StepBar steps={SEND_STEPS} current={sendStep} />}
            {sendStep === 0 && (
              <UploadOrdonnance
                file={file}
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

      case 'attente':
        return ordStatus === 'waiting'
          ? <AttenteOrdonnance pharmacyId={pharmacyId} onReceived={handleReceived} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Aucune ordonnance en attente. <button onClick={() => setActiveTab('send')} style={{ color: 'var(--green-600)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600 }}>Envoyer une ordonnance →</button>
            </div>;

      case 'valider':
        return ordStatus === 'received' || ordStatus === 'validated'
          ? <ValidationOrdonnance accepted={accepted} onToggle={toggleMed} onConfirm={handleValidate} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              En attente de la réponse du pharmacien.
            </div>;

      case 'paiement':
        return ordStatus === 'validated' || ordStatus === 'paid'
          ? <PaiementOrdonnance pharmacyId={pharmacyId} onConfirm={handlePaid} />
          : <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Validez d'abord vos médicaments.
            </div>;

      case 'confirmation':
        return ordStatus === 'paid'
          ? <ConfirmationPaiement method={payMethod} pharmacyId={pharmacyId} onReset={handleReset} />
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
        <div style={{ marginBottom: '18px' }}>
          <StatsDashboard stats={getStats()} columns={3} />
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
