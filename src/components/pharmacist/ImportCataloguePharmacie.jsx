import { useState } from 'react';
import { Card, Button, BiIcon } from '../shared/UI';
import { uploadPharmacyDrugsCSV } from '../../services/supabaseApi';

export default function ImportCataloguePharmacie({ pharmacyId, pharmacyName, drugsCount = 0, loading = false, onImported }) {
  const [file, setFile] = useState(null);
  const [replaceCatalog, setReplaceCatalog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!file) {
      setError('Choisissez un fichier CSV/XLSX avant de lancer l\'import.');
      return;
    }

    if (!pharmacyId) {
      setError('Aucune pharmacie associée au compte connecté.');
      return;
    }

    setError('');
    setMessage('');
    setImporting(true);

    try {
      const result = await uploadPharmacyDrugsCSV(file, pharmacyId, { replaceCatalog });

      if (result?.error || !result?.success) {
        setError(result?.error?.message || 'Import impossible.');
        return;
      }

      const importedCount = result?.count || 0;
      const skippedCount = result?.skipped || 0;
      const deactivatedCount = result?.deactivated || 0;
      setMessage(`Import terminé: ${importedCount} médicament(s) inséré(s)/mis à jour${skippedCount ? `, ${skippedCount} ligne(s) ignorée(s)` : ''}${replaceCatalog ? `, ${deactivatedCount} médicament(s) désactivé(s)` : ''}.`);
      setFile(null);
      if (typeof onImported === 'function') {
        await onImported();
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green-800)', marginBottom: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <BiIcon name="upload" />
            Import du catalogue médicaments
          </span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          {pharmacyName ? `Pharmacie cible: ${pharmacyName}` : 'Pharmacie cible: non définie'}
          <br />
          Formats acceptés: CSV, XLSX. Colonnes acceptées: CIP/code13ref, Nom/Désignation, Prix_PVTT/Prix Public, Quantity/Quantite, CodeForme/Catégorie.
          <br />
          Seules les lignes avec stock supérieur à 0 sont importées, et le prix utilisé est celui du prix PVTT.
        </div>

        <div style={{
          border: '1px dashed var(--gray-300)',
          borderRadius: '12px',
          background: 'var(--gray-50)',
          padding: '16px',
          marginBottom: '12px',
        }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              setError('');
              setMessage('');
            }}
          />
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--gray-600)' }}>
            {file ? `${file.name} (${Math.max(1, Math.round((file.size || 0) / 1024))} Ko)` : 'Aucun fichier sélectionné'}
          </div>

          <label style={{
            marginTop: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--gray-700)',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={replaceCatalog}
              onChange={(event) => setReplaceCatalog(event.target.checked)}
            />
            Remplacer le catalogue: désactiver les médicaments absents du fichier
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            onClick={handleImport}
            disabled={importing || loading || !pharmacyId}
          >
            {importing ? 'Import en cours...' : 'Importer les médicaments'}
          </Button>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '999px',
            background: 'var(--blue-50)',
            color: 'var(--blue-800)',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            <BiIcon name="capsule-pill" />
            Catalogue actuel: {loading ? '...' : drugsCount} médicament(s)
          </div>
        </div>

        {message && (
          <div style={{ marginTop: '12px', borderRadius: '10px', padding: '10px 12px', background: 'var(--green-50)', color: 'var(--green-700)', fontSize: '13px', fontWeight: 600 }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '12px', borderRadius: '10px', padding: '10px 12px', background: 'var(--coral-50)', color: 'var(--coral-600)', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
