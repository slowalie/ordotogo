import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Topbar from '../../components/shared/Topbar';
import TabNav from '../../components/shared/TabNav';
import { STATUS } from '../../data/mockData';

import AlertesPharmacie      from '../../components/pharmacist/AlertesPharmacie';
import CreerOrdonnance       from '../../components/pharmacist/CreerOrdonnance';
import PreparationOrdonnances from '../../components/pharmacist/PreparationOrdonnances';
import ValidateLivraisonOrdonnance from '../../components/pharmacist/ValidateLivraisonOrdonnance';
import HistoriquePharmacie   from '../../components/pharmacist/HistoriquePharmacie';
import StatsDashboard from '../../components/shared/StatsDashboard';
import { MOCK_PHARMA_HISTORY } from '../../data/mockData';

const IconBell = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBox = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const IconDoc = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export default function PharmacistPage() {
  const { alerts, prepOrders, waitingDeliveryOrders, patientOrders, submitTranscription } = useApp();
  const [activeTab,    setActiveTab]    = useState('alerts');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sentSuccess,   setSentSuccess]  = useState(false);



  const handleTreat = (alert) => {
    setSelectedAlert(alert);
    setActiveTab('create');
    setSentSuccess(false);
  };

  const handleSent = (payload) => {
    if (!selectedAlert) return;
    submitTranscription({
      orderId: selectedAlert.id,
      meds: payload.meds,
      conseil: payload.conseil,
      total: payload.total,
    });
    setSentSuccess(true);
  };

  const handleBackFromCreate = () => {
    setActiveTab('alerts');
    setSelectedAlert(null);
    setSentSuccess(false);
  };

  const waitingValidationCount = prepOrders.filter(order => order.status === STATUS.PAID).length;
  const readyForPickupCount = waitingDeliveryOrders.length;

  const tabs = [
    { id: 'alerts',    label: 'Alertes',      icon: 'bell', badge: alerts.length },
    { id: 'create',    label: 'Ordonnance',   icon: 'pencil-square'  },
    { id: 'prep',      label: 'Préparation',  icon: 'flask', badge: waitingValidationCount },
    { id: 'livraison', label: 'Livraison',    icon: 'bag-check', badge: readyForPickupCount },
    { id: 'history',   label: 'Historique',   icon: 'journal-text'  },
  ];

  const deliveredOrders = patientOrders.filter(order => order.status === STATUS.DELIVERED);
  const pharmaHistory = deliveredOrders.length > 0 ? deliveredOrders : MOCK_PHARMA_HISTORY || [];
  const getStats = () => {
    const pending = alerts.length;
    const preparations = prepOrders.length;
    const historyCount = deliveredOrders.length > 0 ? deliveredOrders.length : pharmaHistory.length;
    return [
      { label: 'Alertes', value: pending, icon: IconBell, bgColor: '#fffbeb', iconColor: '#d97706', onClick: () => setActiveTab('alerts') },
      { label: 'Préparations', value: preparations, icon: IconBox, bgColor: '#ffedd5', iconColor: '#ea580c', onClick: () => setActiveTab('prep') },
      { label: 'Historique', value: historyCount, icon: IconDoc, bgColor: '#f0fdf4', iconColor: '#16a34a', onClick: () => setActiveTab('history') },
    ];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'alerts':
        return (
          <AlertesPharmacie
            alerts={alerts}
            onTreat={handleTreat}
          />
        );

      case 'create':
        if (sentSuccess) {
          return (
            <div className="pharma-success">
              <div className="pharma-success__card">
                <div className="pharma-success__icon"><i className="bi bi-send-fill" aria-hidden="true" /></div>
                <div className="pharma-success__title">
                  Ordonnance envoyée !
                </div>
                <div className="pharma-success__text">
                  L'ordonnance numérique a été transmise à{' '}
                  <strong>{selectedAlert?.patientName}</strong>.<br />
                  En attente de validation et paiement du patient.
                </div>
                <div className="pharma-success__pill">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><i className="bi bi-hourglass-split" aria-hidden="true" />En attente de validation patient</span>
                </div>
              </div>
              <div className="pharma-success__actions">
                <button
                  onClick={handleBackFromCreate}
                  className="pharma-success__button is-secondary"
                >
                  ← Retour aux alertes
                </button>
                <button
                  onClick={() => setActiveTab('prep')}
                  className="pharma-success__button is-primary"
                >
                  Voir les préparations →
                </button>
              </div>
            </div>
          );
        }
        return (
          <CreerOrdonnance
            alert={selectedAlert}
            onSend={handleSent}
            onBack={handleBackFromCreate}
          />
        );

      case 'prep':
        return <PreparationOrdonnances />;

      case 'livraison':
        return <ValidateLivraisonOrdonnance />;

      case 'history':
        return <HistoriquePharmacie />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Topbar notifCount={alerts.length} />
      <TabNav tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <main className="container" style={{ flex: 1, paddingTop: 'var(--space-md)', paddingBottom: 'var(--space-md)' }}>
        <h2 style={{ margin: '8px 0 12px', color: 'var(--green-800)', fontFamily: 'var(--font-display)', fontSize: '18px' }}>Espace Pharmacien</h2>
        <div style={{ marginBottom: '18px' }}>
          <StatsDashboard stats={getStats()} columns={3} />
        </div>
        {renderContent()}
      </main>
    </div>
  );
}
