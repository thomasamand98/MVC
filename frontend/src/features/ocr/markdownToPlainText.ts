// Convertit le Markdown renvoyé par l'OCR Mistral en texte brut, prêt à
// coller dans n'importe quel champ : titres, gras/italique, liens, images
// et tableaux sont réduits à leur seul texte (cellules séparées par une
// tabulation, pour rester collables dans un tableur).
export function markdownToPlainText(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line)) // séparateurs de tableau |---|---|
    .map((line) => {
      let out = line
        .replace(/^\s{0,3}#{1,6}\s+/, '') // titres
        .replace(/^\s{0,3}>\s?/, '') // citations
        .replace(/^\s*[-*+]\s+/, '') // puces de liste
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '') // images
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // liens → texte du lien
        .replace(/(\*\*|__)(.+?)\1/g, '$2') // gras
        .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?=[^*\w]|$)/g, '$1$2') // italique
        .replace(/`([^`]+)`/g, '$1') // code en ligne
      if (/^\s*\|.*\|\s*$/.test(out)) {
        out = out.trim().slice(1, -1).split('|').map((cell) => cell.trim()).join('\t')
      }
      return out.trimEnd()
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
