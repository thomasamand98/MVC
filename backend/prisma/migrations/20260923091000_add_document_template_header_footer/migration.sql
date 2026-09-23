-- Ajoute l'en-tête et le pied de page (répétés sur chaque page à
-- l'impression) au modèle de document. Appliquée directement via
-- `prisma db execute` plutôt que `prisma migrate dev`/`db push` (voir la
-- migration précédente pour le contexte de la divergence d'historique).
ALTER TABLE `document_templates`
  ADD COLUMN `Contenu_entete` LONGTEXT NULL AFTER `Description`,
  ADD COLUMN `Contenu_pied` LONGTEXT NULL AFTER `Contenu_html`;
