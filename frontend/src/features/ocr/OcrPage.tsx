import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { MAX_OCR_FILE_SIZE, isOcrSupported, runOcr } from './useOcr.js'
import { OCR_PRESETS } from './ocrPresets.js'
import '../../components/PageActions.css'
import './OcrPage.css'

type OcrResult = { text: string; annotation: unknown; durationMs: number }

const DEFAULT_PRESET = OCR_PRESETS.find((preset) => preset.id === 'transport') ?? OCR_PRESETS[0]

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

// Vérifié ici avant l'envoi pour un message immédiat — le backend refait
// la même vérification (voir parseAnnotation dans mistral.controller.ts).
function schemaError(schema: string): string | null {
  if (!schema.trim()) return null
  try {
    const parsed: unknown = JSON.parse(schema)
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? null : 'Le schéma JSON doit être un objet.'
  } catch {
    return "Le schéma JSON n'est pas un JSON valide."
  }
}

// Page de test de l'OCR Mistral (Configuration > Test OCR) : on dépose un
// PDF ou une image, on choisit éventuellement une extraction structurée
// (prompt + JSON Schema, voir ocrPresets.ts), on lance l'OCR et on compare
// le fichier d'origine (à gauche) au résultat de POST /mistral/ocr (à
// droite) : le JSON extrait puis le Markdown brut.
export function OcrPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id)
  const [prompt, setPrompt] = useState(DEFAULT_PRESET.prompt)
  const [schema, setSchema] = useState(DEFAULT_PRESET.schema)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<OcrResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'json' | 'text' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // URL locale pour l'aperçu du fichier, libérée au changement de fichier.
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setPreviewUrl(null)
    }
  }, [file])

  function selectFile(next: File | undefined) {
    if (!next) return
    setResult(null)
    setCopied(null)
    if (!isOcrSupported(next)) {
      setError('Seuls les PDF et les images sont acceptés.')
      return
    }
    if (next.size > MAX_OCR_FILE_SIZE) {
      setError(`Fichier trop volumineux (${formatSize(next.size)}, maximum ${formatSize(MAX_OCR_FILE_SIZE)}).`)
      return
    }
    setError(null)
    setFile(next)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    selectFile(e.dataTransfer.files[0])
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0])
    // Permet de re-sélectionner le même fichier après une erreur.
    e.target.value = ''
  }

  function handlePresetChange(id: string) {
    const preset = OCR_PRESETS.find((candidate) => candidate.id === id)
    if (!preset) return
    setPresetId(preset.id)
    setPrompt(preset.prompt)
    setSchema(preset.schema)
  }

  async function handleRun() {
    if (!file) return
    const invalidSchema = schemaError(schema)
    if (invalidSchema) {
      setError(invalidSchema)
      return
    }
    if (prompt.trim() && !schema.trim()) {
      setError('Un prompt exige un schéma JSON.')
      return
    }
    setRunning(true)
    setError(null)
    setResult(null)
    setCopied(null)
    const start = performance.now()
    try {
      const response = await runOcr(file, { schema, prompt })
      setResult({ ...response, durationMs: performance.now() - start })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRunning(false)
    }
  }

  async function handleCopy(kind: 'json' | 'text') {
    if (!result) return
    await navigator.clipboard.writeText(kind === 'json' ? JSON.stringify(result.annotation, null, 2) : result.text)
    setCopied(kind)
  }

  return (
    <div>
      <div className="page-header">
        <h2>Test OCR (Mistral)</h2>
        <button type="button" className="page-actions-button primary" disabled={!file || running} onClick={handleRun}>
          {running ? 'Extraction en cours...' : "Lancer l'OCR"}
        </button>
      </div>

      <div
        className={`ocr-drop${dragOver ? ' drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <span>
            <strong>{file.name}</strong> · {formatSize(file.size)} — cliquer ou déposer pour changer de fichier
          </span>
        ) : (
          <span>Glisser-déposer un PDF ou une image ici, ou cliquer pour choisir (max {formatSize(MAX_OCR_FILE_SIZE)})</span>
        )}
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*" hidden onChange={handleFileInput} />
      </div>

      <details className="ocr-settings" open>
        <summary>Extraction structurée</summary>
        <label className="ocr-field">
          <span>Préréglage</span>
          <select value={presetId} onChange={(e) => handlePresetChange(e.target.value)}>
            {OCR_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <div className="ocr-settings-grid">
          <label className="ocr-field">
            <span>Prompt (consigne pour l'extraction)</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={14} spellCheck={false} />
          </label>
          <label className="ocr-field">
            <span>Schéma JSON de sortie (vide = OCR seul)</span>
            <textarea value={schema} onChange={(e) => setSchema(e.target.value)} rows={14} spellCheck={false} className="ocr-code" />
          </label>
        </div>
      </details>

      {error && <p className="ocr-error">{error}</p>}

      {file && previewUrl && (
        <div className="ocr-panels">
          <section className="ocr-panel">
            <h3>Fichier d'origine</h3>
            {file.type === 'application/pdf' ? (
              <iframe className="ocr-preview" src={previewUrl} title={file.name} />
            ) : (
              <img className="ocr-preview ocr-preview-image" src={previewUrl} alt={file.name} />
            )}
          </section>
          <section className="ocr-panel">
            {result ? (
              <>
                <p className="ocr-meta">
                  {result.text.length.toLocaleString('fr-FR')} caractères · {(result.durationMs / 1000).toFixed(1)} s
                </p>
                {result.annotation !== null && (
                  <>
                    <div className="ocr-panel-header">
                      <h3>Extraction structurée (JSON)</h3>
                      <button type="button" className="page-actions-button" onClick={() => handleCopy('json')}>
                        {copied === 'json' ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                    <pre className="ocr-result ocr-result-json">{JSON.stringify(result.annotation, null, 2)}</pre>
                  </>
                )}
                <div className="ocr-panel-header">
                  <h3>Texte extrait (Markdown)</h3>
                  <button type="button" className="page-actions-button" onClick={() => handleCopy('text')}>
                    {copied === 'text' ? 'Copié' : 'Copier'}
                  </button>
                </div>
                <pre className="ocr-result">{result.text || '(aucun texte détecté)'}</pre>
              </>
            ) : (
              <>
                <h3>Résultat</h3>
                <p className="ocr-placeholder">
                  {running ? 'Extraction en cours...' : "Cliquer sur « Lancer l'OCR » pour extraire le texte."}
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
