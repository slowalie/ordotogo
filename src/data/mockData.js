// ── Mock data ──────────────────────────────────────────────────────────────

export const PHARMACIES = [
  { id: 1, name: 'Pharmacie Bénin Santé',  zone: 'Lomé Centre',  dist: '0.4 km', phone: '+228 90 00 01 01', open: true  },
  { id: 2, name: 'Pharmacie du Golfe',     zone: 'Tokoin',       dist: '0.9 km', phone: '+228 90 00 02 02', open: true  },
  { id: 3, name: 'Pharmacie Espoir',       zone: 'Bè-Kpota',    dist: '1.6 km', phone: '+228 90 00 03 03', open: false },
  { id: 4, name: 'Pharmacie de la Paix',   zone: 'Hédzranawoé', dist: '2.1 km', phone: '+228 90 00 04 04', open: true  },
];

export const DRUG_DATABASE = [
  { id: 'amox500',  name: 'Amoxicilline 500mg',    price: 2800, category: 'Antibiotique'     },
  { id: 'para1g',   name: 'Paracétamol 1000mg',    price: 1200, category: 'Antalgique'       },
  { id: 'ibu400',   name: 'Ibuprofène 400mg',       price: 1500, category: 'Anti-inflammatoire'},
  { id: 'metf500',  name: 'Metformine 500mg',       price: 3200, category: 'Antidiabétique'  },
  { id: 'omep20',   name: 'Oméprazole 20mg',        price: 2100, category: 'Gastroprotecteur'},
  { id: 'cipr500',  name: 'Ciprofloxacine 500mg',   price: 4500, category: 'Antibiotique'    },
  { id: 'lora10',   name: 'Loratadine 10mg',        price: 900,  category: 'Antihistaminique'},
  { id: 'vitc500',  name: 'Vitamine C 500mg',       price: 600,  category: 'Supplément'      },
  { id: 'sali5',    name: 'Salbutamol 5mg',         price: 3800, category: 'Bronchodilatateur'},
  { id: 'doxy100',  name: 'Doxycycline 100mg',      price: 3300, category: 'Antibiotique'    },
];

export const MOCK_ALERTS = [
  {
    id: 1,
    patientName: 'Kokou Mensah',
    patientId:   'PAT-001',
    sentAt:      '2025-04-29T08:42:00',
    pharmacy:    1,
    status:      'pending',
    note:        'Ordonnance pour infection respiratoire',
  },
  {
    id: 2,
    patientName: 'Ama Dzifa',
    patientId:   'PAT-002',
    sentAt:      '2025-04-29T08:25:00',
    pharmacy:    1,
    status:      'pending',
    note:        'Renouvellement traitement chronique',
  },
];

export const MOCK_PATIENT_HISTORY = [
  {
    id:       'ORD-2025-047',
    pharmacy: 'Pharmacie du Golfe',
    date:     '15 avr. 2025',
    status:   'delivered',
    total:    4000,
    meds:     ['Amoxicilline 500mg', 'Paracétamol 1000mg'],
  },
  {
    id:       'ORD-2025-031',
    pharmacy: 'Pharmacie Bénin Santé',
    date:     '2 mars 2025',
    status:   'delivered',
    total:    1500,
    meds:     ['Ibuprofène 400mg'],
  },
];

export const MOCK_PHARMA_HISTORY = [
  { id: 'ORD-2025-046', patient: 'Ama Dzifa',    date: '22 avr.', total: 1500, method: 'Mixx',     meds: ['Ibuprofène 400mg × 12'] },
  { id: 'ORD-2025-038', patient: 'Komlan Agbi',  date: '19 avr.', total: 2400, method: 'Pharmacie', meds: ['Paracétamol 1000mg × 24'] },
  { id: 'ORD-2025-029', patient: 'Yawa Sossou',  date: '10 avr.', total: 6800, method: 'Mixx',     meds: ['Amoxicilline 500mg × 21', 'Oméprazole 20mg × 14'] },
];

// Statuts ordonnance
export const STATUS = {
  PENDING:              'pending',
  PROCESSING:           'processing',
  WAITING_VALIDATION:   'waiting_validation',
  VALIDATED:            'validated',
  PAID:                 'paid',
  PREPARING:            'preparing',           // Pharmacien prépare les médicaments
  READY_FOR_PICKUP:     'ready_for_pickup',    // Prêt avec QR code et code de récupération
  AWAITING_DELIVERY:    'awaiting_delivery',   // Patient attend la présentation du code
  DELIVERED:            'delivered',
};
