import { useEffect, useId, useState } from 'react'
import { apiJson } from '../lib/api'
import type { AdresseValues } from '../lib/adresse'
import { FicheField } from './FicheLayout.js'

type PaysOption = { IDPAYS: string; ISO: string | null; Nom: string | null }
type VilleOption = { IDVILLES: string; Nom_ville: string | null }

// Champs d'adresse d'une fiche (dans une grille .fiche-grid) : villes
// proposées selon le code postal, pays choisi dans la liste de la table
// `pays` (le nom complet est gardé avec le code ISO).
export function AdresseFields({ value, onChange }: { value: AdresseValues; onChange: (patch: Partial<AdresseValues>) => void }) {
  const villesId = useId()
  const [paysOptions, setPaysOptions] = useState<PaysOption[]>([])
  const [villeOptions, setVilleOptions] = useState<VilleOption[]>([])

  // Liste des pays : ~240 lignes, chargée une seule fois.
  useEffect(() => {
    apiJson<{ pays: PaysOption[] }>('pays')
      .then((json) => setPaysOptions(json.pays))
      .catch(() => {})
  }, [])

  // Villes du code postal saisi, avec un léger anti-rebond — la table en
  // compte ~39 000, impossible à charger en une fois.
  useEffect(() => {
    if (!value.CP.trim()) return
    const timeout = setTimeout(() => {
      apiJson<{ villes: VilleOption[] }>(`villes?cp=${encodeURIComponent(value.CP.trim())}`)
        .then((json) => setVilleOptions(json.villes))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timeout)
  }, [value.CP])

  const text = (key: keyof AdresseValues, maxLength: number) => ({
    value: value[key],
    maxLength,
    onChange: (e: { target: { value: string } }) => onChange({ [key]: e.target.value }),
  })
  // Un pays enregistré mais absent de la liste reste proposé, pour ne pas
  // être perdu à l'enregistrement.
  const paysChoices = value.Pays && !paysOptions.some((p) => p.ISO === value.Pays)
    ? [{ IDPAYS: 'current', ISO: value.Pays, Nom: value.Pays_full_name || value.Pays }, ...paysOptions]
    : paysOptions
  const villes = value.CP.trim() ? villeOptions : []

  return (
    <div className="fiche-grid">
      <FicheField label="Adresse" wide><input {...text('Adresse1', 250)} autoComplete="address-line1" /></FicheField>
      <FicheField label="Complément" wide><input {...text('Adresse2', 250)} autoComplete="address-line2" /></FicheField>
      <FicheField label="Complément 2" wide><input {...text('Adresse3', 250)} autoComplete="address-line3" /></FicheField>
      <FicheField label="Code postal"><input {...text('CP', 50)} autoComplete="postal-code" /></FicheField>
      <FicheField label="Ville">
        <input {...text('Localite', 50)} list={villesId} autoComplete="address-level2" />
        <datalist id={villesId}>{villes.map((v) => <option key={v.IDVILLES} value={v.Nom_ville ?? ''} />)}</datalist>
      </FicheField>
      <FicheField label="Pays" wide>
        <select
          value={value.Pays}
          onChange={(e) => {
            const match = paysOptions.find((p) => p.ISO === e.target.value)
            onChange({ Pays: e.target.value, Pays_full_name: match?.Nom ?? '' })
          }}
        >
          <option value="">—</option>
          {paysChoices.map((p) => <option key={p.IDPAYS} value={p.ISO ?? ''}>{p.Nom}</option>)}
        </select>
      </FicheField>
    </div>
  )
}
