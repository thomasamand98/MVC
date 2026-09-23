// Arbre des champs de fusion disponibles pour l'éditeur de modèles de
// document (voir DocumentTemplateEditor.tsx). Un champ « simple » se
// dépose sous forme d'un jeton {{ Chemin }} dans le texte ; un champ de
// type « liste » se dépose sous forme d'un tableau répétable (une ligne
// par élément de la liste au moment de la fusion, côté backend — non
// implémenté ici, voir le composant pour le détail).
//
// Les chemins (`path`) reprennent le nom des modèles Prisma tels
// qu'exposés par l'API (voir backend/prisma/schema.prisma), pour qu'un
// futur moteur de fusion puisse les résoudre sans table de correspondance
// supplémentaire. `[]` marque une collection : un champ sous une liste a
// un chemin du type `Contrat.Prestations[].Prix_unitaire`.

// 'image' (ex. Entite.Logo) : le champ se dépose comme une vignette image
// plutôt qu'un jeton texte, résolue à la génération contre la data URI
// base64 du logo — voir domInsert.ts et backend/src/document-merge/merge-html.ts.
export type MergeFieldKind = 'text' | 'date' | 'number' | 'image'

export type MergeField = {
  path: string
  label: string
  kind: MergeFieldKind
}

export type MergeFieldGroup = {
  id: string
  label: string
  /** Chemin de la collection pour un groupe de type liste (répétable). */
  listPath?: string
  fields: MergeField[]
  /** Sous-listes imbriquées (ex. les suppléments d'une prestation). */
  children?: MergeFieldGroup[]
  /** Colonnes proposées par défaut quand on dépose le groupe entier (tableau
   * répétable) — sous-ensemble de `fields`, dans l'ordre d'affichage.
   * À défaut, les 4 premiers champs du groupe sont utilisés. */
  defaultColumns?: string[]
}

export const MERGE_FIELD_GROUPS: MergeFieldGroup[] = [
  {
    id: 'emetteur',
    label: 'Émetteur (notre société)',
    fields: [
      { path: 'Entite.Logo', label: 'Logo', kind: 'image' },
      { path: 'Entite.Nom_societe', label: 'Raison sociale', kind: 'text' },
      { path: 'Entite.Adresse.Adresse1', label: 'Adresse', kind: 'text' },
      { path: 'Entite.Adresse.CP', label: 'Code postal', kind: 'text' },
      { path: 'Entite.Adresse.Localite', label: 'Localité', kind: 'text' },
      { path: 'Entite.Adresse.Pays_full_name', label: 'Pays', kind: 'text' },
      { path: 'Entite.Num_TVA', label: 'N° TVA', kind: 'text' },
      { path: 'Entite.Num_Telephone', label: 'Téléphone', kind: 'text' },
      { path: 'Entite.Email_contact', label: 'E-mail', kind: 'text' },
      { path: 'Entite.Nom_Banque', label: 'Banque', kind: 'text' },
      { path: 'Entite.Iban', label: 'IBAN', kind: 'text' },
      { path: 'Entite.Bic', label: 'BIC', kind: 'text' },
      { path: 'Entite.Signataire', label: 'Signataire', kind: 'text' },
    ],
  },
  {
    id: 'contrat',
    label: 'Contrat',
    fields: [
      { path: 'Contrat.Num_contrat', label: 'N° contrat', kind: 'text' },
      { path: 'Contrat.Version_contrat', label: 'Version', kind: 'text' },
      { path: 'Contrat.Date_debut', label: 'Date de début', kind: 'date' },
      { path: 'Contrat.Date_fin', label: 'Date de fin', kind: 'date' },
      { path: 'Contrat.Reference_client', label: 'Référence client', kind: 'text' },
      { path: 'Contrat.Taux_tva', label: 'Taux TVA', kind: 'number' },
      { path: 'Contrat.Instruction_CMR', label: 'Instruction CMR', kind: 'text' },
      { path: 'Contrat.Description_projet', label: 'Description du projet', kind: 'text' },
      { path: 'Contrat.Commissionnaire', label: 'Commissionnaire', kind: 'text' },
      { path: 'Contrat.TypeFacture.Nom', label: 'Type de facture', kind: 'text' },
    ],
  },
  {
    id: 'client',
    label: 'Client (Société)',
    fields: [
      { path: 'Contrat.Societe.Nom_societe', label: 'Nom société', kind: 'text' },
      { path: 'Contrat.Societe.Denomination', label: 'Dénomination', kind: 'text' },
      { path: 'Contrat.Societe.TVA', label: 'N° TVA', kind: 'text' },
      { path: 'Contrat.Societe.Client.Numero_client', label: 'N° client', kind: 'text' },
      { path: 'Contrat.Societe.Client.Delai_paiement', label: 'Délai de paiement', kind: 'text' },
      { path: 'Contrat.Societe.Adresse.Adresse1', label: 'Adresse', kind: 'text' },
      { path: 'Contrat.Societe.Adresse.CP', label: 'Code postal', kind: 'text' },
      { path: 'Contrat.Societe.Adresse.Localite', label: 'Localité', kind: 'text' },
      { path: 'Contrat.Societe.Adresse.Pays_full_name', label: 'Pays', kind: 'text' },
    ],
  },
  {
    id: 'prestations',
    label: 'Prestations',
    listPath: 'Contrat.Prestations[]',
    defaultColumns: [
      'Contrat.Prestations[].Type',
      'Contrat.Prestations[].Description_prestation',
      'Contrat.Prestations[].Unite',
      'Contrat.Prestations[].Prix_unitaire',
    ],
    fields: [
      { path: 'Contrat.Prestations[].Type', label: 'Type', kind: 'text' },
      { path: 'Contrat.Prestations[].Description_prestation', label: 'Description', kind: 'text' },
      { path: 'Contrat.Prestations[].Description_courte', label: 'Description courte', kind: 'text' },
      { path: 'Contrat.Prestations[].Prix_unitaire', label: 'P.U.', kind: 'number' },
      { path: 'Contrat.Prestations[].Unite', label: 'Unité', kind: 'text' },
      { path: 'Contrat.Prestations[].Marchandise.Nom_marchandise', label: 'Marchandise', kind: 'text' },
      { path: 'Contrat.Prestations[].Instruction', label: 'Instruction', kind: 'text' },
    ],
    children: [
      {
        id: 'prestations-supplementaires',
        label: 'Prestations supplémentaires',
        listPath: 'Contrat.Prestations[].PrestationSupplementaires[]',
        defaultColumns: [
          'Contrat.Prestations[].PrestationSupplementaires[].Description_prestation',
          'Contrat.Prestations[].PrestationSupplementaires[].Unite',
          'Contrat.Prestations[].PrestationSupplementaires[].Prix_unitaire',
        ],
        fields: [
          { path: 'Contrat.Prestations[].PrestationSupplementaires[].Description_prestation', label: 'Description', kind: 'text' },
          { path: 'Contrat.Prestations[].PrestationSupplementaires[].Prix_unitaire', label: 'P.U.', kind: 'number' },
          { path: 'Contrat.Prestations[].PrestationSupplementaires[].Unite', label: 'Unité', kind: 'text' },
        ],
      },
    ],
  },
  {
    id: 'divers',
    label: 'Divers',
    fields: [
      { path: 'Divers.Date_edition', label: 'Date d’édition', kind: 'date' },
      { path: 'Divers.CGV_URL', label: 'Lien conditions générales de vente', kind: 'text' },
    ],
  },
]

// Aplatit l'arbre (groupes + sous-groupes) pour la recherche et pour
// retrouver un champ par chemin.
export function flattenGroups(groups: MergeFieldGroup[]): MergeFieldGroup[] {
  return groups.flatMap((group) => [group, ...(group.children ? flattenGroups(group.children) : [])])
}

export function findFieldByPath(path: string): MergeField | undefined {
  for (const group of flattenGroups(MERGE_FIELD_GROUPS)) {
    const field = group.fields.find((f) => f.path === path)
    if (field) return field
  }
  return undefined
}

export function findGroupById(id: string): MergeFieldGroup | undefined {
  return flattenGroups(MERGE_FIELD_GROUPS).find((g) => g.id === id)
}

/** Groupes de type liste (répétables), toutes profondeurs confondues —
 * utilisés pour le sélecteur « Insérer un bloc répétable » de la barre
 * d'outils. */
export function listGroups(): MergeFieldGroup[] {
  return flattenGroups(MERGE_FIELD_GROUPS).filter((g) => !!g.listPath)
}
