import { useRef } from 'react';
import { Card, Button, BiIcon } from '../shared/UI';

function getFileKind(file, previewUrl) {
  const source = `${file?.name || ''} ${file?.type || ''} ${previewUrl || ''}`.toLowerCase();

  if (/\.pdf(?:$|[?#])|application\/pdf/.test(source)) return 'pdf';
  if (/\.docx?(?:$|[?#])|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/msword/.test(source)) return 'doc';
  if (source.startsWith('data:image/') || source.includes('image/')) return 'image';
  return 'unknown';
}

export default function UploadOrdonnance({ file, previewUrl, onFileChange, onNext }) {
  const inputRef = useRef();
  const fileKind = getFileKind(file, previewUrl);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(dropped);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn .3s both' }}>
      <Card>
        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--green-800)', marginBottom: '4px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="file-earmark-medical" />Document d'ordonnance</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Envoyez une image, un PDF, ou un fichier Word de votre ordonnance médicale.
        </div>

        {previewUrl ? (
          <div>
            <div className="upload-preview-wrap">
              {fileKind === 'image' && <img src={previewUrl} alt="Prévisualisation ordonnance" className="upload-preview-img" />}
              {fileKind === 'pdf' && (
                <iframe
                  src={previewUrl}
                  title="Prévisualisation PDF"
                  style={{ width: '100%', height: '320px', border: 'none', borderRadius: '12px', background: '#fff' }}
                />
              )}
              {fileKind === 'doc' && (
                <div style={{
                  minHeight: '220px',
                  borderRadius: '12px',
                  border: '1px solid var(--gray-200)',
                  background: 'var(--gray-50)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <div>
                    <BiIcon name="file-earmark-word" size={34} />
                    <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--gray-700)', fontWeight: 600 }}>
                      Fichier Word prêt à être envoyé
                    </div>
                    <a href={previewUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12px', color: 'var(--green-700)', fontWeight: 700, textDecoration: 'none' }}>
                      Ouvrir le fichier
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="upload-dropzone__subtitle">
                {file?.name} · {file ? (file.size / 1024).toFixed(0) : 0} Ko
              </div>
              <Button variant="ghost" onClick={() => inputRef.current.click()}>
                Changer le fichier
              </Button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            className={file ? 'upload-dropzone is-filled' : 'upload-dropzone'}
          >
            <div className="upload-dropzone__icon">{file ? <BiIcon name="check2-circle" size={40} /> : <BiIcon name="file-earmark-text" size={40} />}</div>
            {file ? (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-700)' }}>{file.name}</div>
                <div className="upload-dropzone__subtitle">
                  {(file.size / 1024).toFixed(0)} Ko · Cliquez pour changer
                </div>
              </>
            ) : (
              <>
                <div className="upload-dropzone__title">
                  Glissez-déposez ou cliquez pour choisir
                </div>
                <div className="upload-dropzone__subtitle">
                  JPG, PNG, PDF, DOC, DOCX · Max 10 Mo
                </div>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: 'none' }}
          onChange={e => e.target.files[0] && onFileChange(e.target.files[0])}
        />

        {file && (
          <Button fullWidth onClick={onNext} style={{ marginTop: '16px' }}>
            Choisir une pharmacie →
          </Button>
        )}
      </Card>

      {/* How it works */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--green-800)', marginBottom: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><BiIcon name="info-circle" />Comment ça marche ?</span>
        </div>
        {[
          { step: '1', text: 'Prenez en photo votre ordonnance manuscrite' },
          { step: '2', text: 'Choisissez la pharmacie qui vous convient' },
          { step: '3', text: 'Le pharmacien prépare votre ordonnance numérique' },
          { step: '4', text: 'Validez les médicaments et choisissez votre mode de paiement' },
        ].map(({ step, text }) => (
          <div key={step} className="upload-step">
            <div className="upload-step__number">{step}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{text}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
