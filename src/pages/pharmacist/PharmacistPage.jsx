import { useState } from 'react';
import Topbar from '../../components/shared/Topbar';
import TabNav from '../../components/shared/TabNav';
import { MOCK_ALERTS } from '../../data/mockData';

import AlertesPharmacie      from '../../components/pharmacist/AlertesPharmacie';
import CreerOrdonnance       from '../../components/pharmacist/CreerOrdonnance';
import PreparationOrdonnances from '../../components/pharmacist/PreparationOrdonnances';
import HistoriquePharmacie   from '../../components/pharmacist/HistoriquePharmacie';

export default function PharmacistPage() {
  const [activeTab,    setActiveTab]    = useState('alerts');
  const [alerts,       setAlerts]       = useState(MOCK_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [sentSuccess,   setSentSuccess]  = useState(false);

  const handleTreat = (alert) => {
    setSelectedAlert(alert);
    setActiveTab('create');
    setSentSuccess(false);
  };

  const handleSent = () => {
    // Remove alert from list
    setAlerts(prev => prev.filter(a => a.id !== selectedAlert?.id));
    setSentSuccess(true);
  };

  const handleBackFromCreate = () => {
    setActiveTab('alerts');
    setSelectedAlert(null);
    setSentSuccess(false);
  };

  const tabs = [
    { id: 'alerts',  label: 'Alertes',     icon: 'bell', badge: alerts.length },
    { id: 'create',  label: 'Ordonnance',  icon: 'pencil-square'  },
    { id: 'prep',    label: 'Préparation', icon: 'flask', badge: 1 },
    { id: 'history', label: 'Historique',  icon: 'journal-text'  },
  ];

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
        {renderContent()}
      </main>
    </div>
  );
}
