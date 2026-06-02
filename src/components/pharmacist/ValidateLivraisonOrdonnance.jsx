import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, Button, BiIcon, Badge } from '../shared/UI';
import { useApp } from '../../context/AppContext';
import { STATUS } from '../../data/mockData';

export default function ValidateLivraisonOrdonnance() {
  const { patientOrders, validateDelivery } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [inputCode, setInputCode] = useState('');
  const [validationResult, setValidationResult] = useState(null); // 'success', 'error', null
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerPendingStart, setScannerPendingStart] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('idle'); // 'idle' | 'starting' | 'scanning'

  const scannerRef = useRef(null);
  const scannerElementId = 'pharmacy-qr-scanner';

  // Ordonnances prêtes à être livrées
  const readyOrders = patientOrders.filter(order => 
    [STATUS.READY_FOR_PICKUP, STATUS.AWAITING_DELIVERY].includes(order.status)
  );

  const selectedOrder = selectedOrderId 
    ? patientOrders.find(o => o.id === selectedOrderId)
    : null;

  const stopScanner = async () => {
    setScannerPendingStart(false);
    setScannerStatus('idle');

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error) {
        // Ignore stop errors when the scanner has already been torn down.
      }

      try {
        await scannerRef.current.clear();
      } catch (error) {
        // Ignore clear errors for the same reason.
      }

      scannerRef.current = null;
    }

    setIsScannerOpen(false);
  };

  const handleValidate = async () => {
    if (!selectedOrder || !inputCode.trim()) {
      setValidationResult('error');
      return;
    }

    const isValid = await validateDelivery(selectedOrder.id, inputCode.trim());
    
    if (isValid) {
      setValidationResult('success');
      setInputCode('');
      setSelectedOrderId(null);
      setTimeout(() => setValidationResult(null), 3000);
    } else {
      setValidationResult('error');
    }
  };

  const handleScanQRCode = (qrCodeData) => {
    try {
      const data = JSON.parse(qrCodeData);
      if (data?.orderId) {
        const matchedOrder = readyOrders.find(order => order.id === data.orderId);
        if (matchedOrder) {
          setSelectedOrderId(matchedOrder.id);
        }
      }

      if (data?.pickupCode) {
        setInputCode(String(data.pickupCode).trim().toUpperCase());
        setValidationResult(null);
      }
    } catch (e) {
      setInputCode(String(qrCodeData || '').trim().toUpperCase());
      setValidationResult(null);
    }
  };

  const startScanner = async () => {
    setScannerError('');
    setIsScannerOpen(true);
    setScannerPendingStart(true);
  };

  const initializeScanner = async () => {
    setScannerStatus('starting');

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('La caméra n\'est pas disponible sur cet appareil ou navigateur.');
      }

      const html5QrCode = new Html5Qrcode(scannerElementId, { verbose: false });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          handleScanQRCode(decodedText);
          await stopScanner();
        },
        () => {}
      );

      setScannerStatus('scanning');
    } catch (error) {
      setScannerError(
        error?.message || 'Accès caméra refusé ou indisponible. Autorisez la caméra puis réessayez.'
      );
      await stopScanner();
    } finally {
      setScannerPendingStart(false);
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, []);

  useEffect(() => {
    if (isScannerOpen && scannerPendingStart) {
      void initializeScanner();
    }
  }, [isScannerOpen, scannerPendingStart]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      {validationResult && (
        <Card style={{ 
          border: validationResult === 'success' ? '2px solid var(--green-500)' : '2px solid var(--red-500)',
          background: validationResult === 'success' ? 'var(--green-50)' : 'var(--red-50)',
          textAlign: 'center',
          padding: '16px'
        }}>
          {validationResult === 'success' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <BiIcon name="check-circle" size={32} style={{ color: 'var(--green-600)' }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green-700)' }}>
                Livraison validée !
              </div>
              <div style={{ fontSize: '13px', color: 'var(--green-600)', marginTop: '4px' }}>
                L'ordonnance a été enregistrée dans l'historique
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <BiIcon name="exclamation-circle" size={32} style={{ color: 'var(--red-600)' }} />
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--red-700)' }}>
                Code incorrect
              </div>
              <div style={{ fontSize: '13px', color: 'var(--red-600)', marginTop: '4px' }}>
                Veuillez vérifier le code et réessayer
              </div>
            </>
          )}
        </Card>
      )}

      {readyOrders.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--gray-600)' }}>
            <BiIcon name="inbox" size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div>Aucune ordonnance à livrer</div>
          </div>
        </Card>
      ) : (
        <>
          {/* Liste des ordonnances prêtes */}
          <Card>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <BiIcon name="bag-check" />
                {readyOrders.length} ordonnance{readyOrders.length > 1 ? 's' : ''} à livrer
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {readyOrders.map(order => (
                <button
                  key={order.id}
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    setInputCode('');
                    setValidationResult(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    border: selectedOrderId === order.id ? '2px solid var(--green-600)' : '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius)',
                    background: selectedOrderId === order.id ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all .2s',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                      {order.patientName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                      {order.id} - {(order.total || 0).toLocaleString()} FCFA
                    </div>
                  </div>
                  <Badge status="ready" />
                </button>
              ))}
            </div>
          </Card>

          {/* Détails de l'ordonnance sélectionnée */}
          {selectedOrder && (
            <Card style={{ padding: 0, overflow: 'hidden', border: '2px solid var(--green-500)', background: 'var(--green-50)' }}>
              <div style={{
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.15)',
                borderBottom: '1px solid var(--green-200)',
              }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-800)' }}>
                  {selectedOrder.patientName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--green-700)' }}>
                  {selectedOrder.id} - {(selectedOrder.total || 0).toLocaleString()} FCFA
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Médicaments à livrer
                  </div>
                  {(selectedOrder.meds || []).map((med, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <span>{med.name} x {med.qty || 1}</span>
                      <span style={{ fontWeight: 600 }}>{(med.price || 0).toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  padding: '12px',
                  background: '#fff',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Saisir le code de récupération
                  </div>
                  <input
                    type="text"
                    placeholder="Entrez les 6 chiffres"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '18px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      letterSpacing: '2px',
                      textAlign: 'center',
                      border: '2px solid var(--gray-300)',
                      borderRadius: '6px',
                      marginBottom: '12px',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--gray-600)', textAlign: 'center' }}>
                    ou scannez le QR code du patient
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    {!isScannerOpen ? (
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={startScanner}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <BiIcon name="qr-code-scan" />
                          Scanner le QR code
                        </span>
                      </Button>
                    ) : (
                      <>
                        <div style={{
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden',
                          border: '1px solid var(--gray-300)',
                          background: '#0b0f14',
                          minHeight: '280px',
                        }}>
                          <div id={scannerElementId} style={{ width: '100%' }} />
                          {scannerStatus !== 'scanning' && (
                            <div style={{
                              minHeight: '280px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '13px',
                              padding: '24px',
                              textAlign: 'center',
                            }}>
                              {scannerError || 'Initialisation de la caméra...'}
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <Button variant="ghost" fullWidth onClick={() => void stopScanner()}>
                            Arrêter le scan
                          </Button>
                        </div>
                      </>
                    )}

                    {scannerError && (
                      <div style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--red-700)',
                        textAlign: 'center',
                      }}>
                        {scannerError}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    fullWidth
                    variant="success"
                    onClick={handleValidate}
                    disabled={!inputCode.trim()}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <BiIcon name="check2-circle" />
                      Valider la livraison
                    </span>
                  </Button>
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={() => {
                      setSelectedOrderId(null);
                      setInputCode('');
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
