// Contenu de départ proposé à la création d'un nouveau modèle : reprend la
// mise en page de l'état de contrat HT&T fourni en référence, répartie sur
// les trois zones de l'éditeur (voir DocumentTemplateEditor.tsx) — en-tête
// (logo, répété sur chaque page), contenu (destinataire, prestations,
// signatures) et pied de page (CGV, coordonnées bancaires, numéro de page,
// répété sur chaque page) — en s'appuyant uniquement sur les champs de
// fusion réels (voir mergeFields.ts). Non figé : l'utilisateur peut tout
// modifier, déplacer ou supprimer une fois dans l'éditeur.
//
// Le HTML généré ici doit rester strictement dans le même format que celui
// que produisent domInsert.ts au runtime (mêmes classes/attributs
// data-merge-field, data-repeat-list, data-chip-remove...), sans quoi les
// jetons déposés ici ne seraient pas reconnus par l'éditeur (suppression,
// mise en forme) ni, plus tard, par le moteur de fusion.

function chip(path: string, label: string, kind: 'text' | 'date' | 'number' | 'image' = 'text'): string {
  if (kind === 'image') {
    return (
      `<span class="dte-chip dte-chip-image" contenteditable="false" data-merge-field="${path}" data-kind="image">` +
      `<span class="dte-chip-image-icon" aria-hidden="true">🖼</span>` +
      `<span class="dte-chip-label">${label}</span>` +
      `<button type="button" class="dte-chip-remove" data-chip-remove aria-label="Retirer le champ ${label}">×</button>` +
      `</span>`
    )
  }
  return (
    `<span class="dte-chip" contenteditable="false" data-merge-field="${path}" data-kind="${kind}">` +
    `<span class="dte-chip-label">${label}</span>` +
    `<button type="button" class="dte-chip-remove" data-chip-remove aria-label="Retirer le champ ${label}">×</button>` +
    `</span>`
  )
}

function repeatTag(label: string): string {
  return (
    `<div class="dte-repeat-tag" contenteditable="false">` +
    `<span>↻ Répété pour chaque « ${label} »</span>` +
    `<button type="button" class="dte-repeat-remove" data-repeat-remove aria-label="Supprimer le bloc « ${label} »">× Supprimer le bloc</button>` +
    `</div>`
  )
}

// En-tête : le logo en haut à gauche, comme demandé — la raison sociale à
// côté sert de repère tant qu'aucun logo n'est importé (voir
// EntiteForm.tsx), le champ image est simplement retiré à la fusion si
// aucun logo n'est défini (voir merge-html.ts).
export const STARTER_HEADER_HTML = `
<div class="dte-header-row">
  ${chip('Entite.Logo', 'Logo', 'image')}
  <p class="dte-address-block">
    ${chip('Entite.Nom_societe', 'Raison sociale')}<br>
    ${chip('Entite.Adresse.Adresse1', 'Adresse')}<br>
    ${chip('Entite.Adresse.CP', 'Code postal')} ${chip('Entite.Adresse.Localite', 'Localité')}
  </p>
</div>
`

export const STARTER_CONTENT_HTML = `
<p class="dte-address-block dte-address-right">
  ${chip('Contrat.Societe.Nom_societe', 'Nom société')}<br>
  ${chip('Contrat.Societe.Adresse.Adresse1', 'Adresse')}<br>
  ${chip('Contrat.Societe.Adresse.CP', 'Code postal')} ${chip('Contrat.Societe.Adresse.Localite', 'Localité')}<br>
  ${chip('Contrat.Societe.Adresse.Pays_full_name', 'Pays')}
</p>

<p>Fait à ${chip('Entite.Adresse.Localite', 'Localité')}, le ${chip('Divers.Date_edition', 'Date d’édition', 'date')}</p>

<div class="dte-header-row">
  <p><strong>N° Contrat :</strong> ${chip('Contrat.Num_contrat', 'N° contrat')}</p>
  <p><strong>N° Client :</strong> ${chip('Contrat.Societe.Client.Numero_client', 'N° client')} &nbsp; <strong>N° T.V.A. :</strong> ${chip('Contrat.Societe.TVA', 'N° TVA')}</p>
</div>

<p><strong>Période du</strong> ${chip('Contrat.Date_debut', 'Date de début', 'date')} <strong>au</strong> ${chip('Contrat.Date_fin', 'Date de fin', 'date')} &nbsp; <strong>Délai paiement :</strong> ${chip('Contrat.Societe.Client.Delai_paiement', 'Délai de paiement')}</p>

<h2>Prestations</h2>

<div class="dte-repeat" data-repeat-list="Contrat.Prestations[]" data-repeat-label="Prestations">
  ${repeatTag('Prestations')}
  <table class="dte-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>Description</th>
        <th>Unité</th>
        <th>P.U.</th>
      </tr>
    </thead>
    <tbody class="dte-repeat-row">
      <tr>
        <td>${chip('Contrat.Prestations[].Type', 'Type')}</td>
        <td>${chip('Contrat.Prestations[].Description_prestation', 'Description')}</td>
        <td>${chip('Contrat.Prestations[].Unite', 'Unité')}</td>
        <td>${chip('Contrat.Prestations[].Prix_unitaire', 'P.U.', 'number')}</td>
      </tr>
      <tr>
        <td class="dte-repeat-subcell" colspan="4">
          <div class="dte-repeat dte-repeat-nested" data-repeat-list="Contrat.Prestations[].PrestationSupplementaires[]" data-repeat-label="Prestations supplémentaires">
            ${repeatTag('Prestations supplémentaires')}
            <table class="dte-table dte-table-nested">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Unité</th>
                  <th>P.U.</th>
                </tr>
              </thead>
              <tbody class="dte-repeat-row">
                <tr>
                  <td>${chip('Contrat.Prestations[].PrestationSupplementaires[].Description_prestation', 'Description')}</td>
                  <td>${chip('Contrat.Prestations[].PrestationSupplementaires[].Unite', 'Unité')}</td>
                  <td>${chip('Contrat.Prestations[].PrestationSupplementaires[].Prix_unitaire', 'P.U.', 'number')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<p class="dte-muted">La signature de la présente offre sous-entend la bonne connaissance et l'acceptation de nos conditions générales de vente co-annexées.</p>

<div class="dte-header-row dte-signature-row">
  <p>Le client<br>Pour accord</p>
  <p>Pour ${chip('Entite.Nom_societe', 'Raison sociale')}<br>${chip('Entite.Signataire', 'Signataire')}</p>
</div>
`

// Pied de page : répété sur chaque page à l'impression — le numéro de page
// est un texte littéral rempli par Chromium (classes spéciales, voir
// DocumentTemplateEditor.tsx, insertPageNumber), pas un champ de fusion.
export const STARTER_FOOTER_HTML = `
<div class="dte-header-row">
  <p>Nos conditions générales de vente sont consultables : ICI &nbsp;—&nbsp; ${chip('Entite.Email_contact', 'E-mail')}</p>
  <p><span class="dte-chip dte-chip-pagenum" contenteditable="false">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></p>
  <p><strong>T.V.A. :</strong> ${chip('Entite.Num_TVA', 'N° TVA')} &nbsp; ${chip('Entite.Nom_Banque', 'Banque')} : ${chip('Entite.Iban', 'IBAN')}</p>
</div>
`
