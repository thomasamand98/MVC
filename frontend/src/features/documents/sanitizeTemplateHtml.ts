import DOMPurify from 'dompurify'

// Le HTML d'un modèle vient de la base (donc potentiellement d'un autre
// utilisateur) ou du mode code de l'éditeur : il est nettoyé avant d'être
// posé dans le canvas, pour qu'aucun <script>, attribut on* ou lien
// javascript: ne s'exécute dans l'application. Les attributs propres à
// l'éditeur (data-*, contenteditable, draggable, voir domInsert.ts) sont
// conservés.
export function sanitizeTemplateHtml(html: string): string {
  return DOMPurify.sanitize(html, { ADD_ATTR: ['contenteditable', 'draggable'] })
}
